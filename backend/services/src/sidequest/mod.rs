pub mod models;

use crate::{ranking, ServiceError, ServiceResult};
use chrono::{NaiveDateTime, Utc};
use futures::TryFutureExt;
use hackathon_portal_repositories::DbRepository;
use models::{AttemptForCreate, SidequestForCreate, SidequestForUpdate};
use std::collections::HashMap;
use std::sync::Arc;

use crate::authorization::groups::Group;
use crate::authorization::AuthorizationService;
use crate::event::models::Event;
use crate::sidequest::models::{
    Attempt, AttemptForUpdate, Cooldown, HistoryEntry, Sidequest, TeamLeaderboardEntry,
    UserLeaderboardEntry,
};
use hackathon_portal_repositories::db::{
    db_sidequest, db_sidequest_attempt, db_sidequest_score, db_team, EventPhase, EventRepository,
    EventRole, SidequestAttemptRepository, SidequestRepository, TeamRepository,
};
use sea_orm::Set;
use sea_orm::{
    prelude::*,
    sea_query::{Func, IntoCondition, SimpleExpr},
    IntoActiveModel, JoinType, QueryOrder, QuerySelect, QueryTrait, TransactionTrait,
};
use slug::slugify;
use tokio::try_join;

pub struct SidequestService {
    authorization_service: Arc<AuthorizationService>,
    db_repo: DbRepository,
}

impl SidequestService {
    #[must_use]
    pub fn new(authorization_service: Arc<AuthorizationService>, db_repo: DbRepository) -> Self {
        Self {
            authorization_service,
            db_repo,
        }
    }

    pub async fn create_sidequest(
        &self,
        sidequest_fc: SidequestForCreate,
    ) -> ServiceResult<Sidequest> {
        let txn = self.db_repo.conn().begin().await?;

        let slug = self
            .generate_slug(&txn, sidequest_fc.event_id, &sidequest_fc.name, None)
            .await?;

        let active_sidequest = db_sidequest::ActiveModel {
            event_id: Set(sidequest_fc.event_id),
            name: Set(sidequest_fc.name),
            slug: Set(slug),
            description: Set(sidequest_fc.description),
            is_higher_result_better: Set(sidequest_fc.is_higher_result_better),
            ..Default::default()
        };

        let sidequest = active_sidequest.insert(&txn).await?;

        txn.commit().await?;

        Ok(sidequest.into())
    }

    pub async fn get_sidequests(&self, event_id: Uuid) -> ServiceResult<Vec<Sidequest>> {
        let sidequests =
            SidequestRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id).await?;
        let sidequests = sidequests.into_iter().map(Sidequest::from).collect();

        Ok(sidequests)
    }

    pub async fn get_sidequest_with_event(
        &self,
        sidequest_id: Uuid,
    ) -> ServiceResult<(Sidequest, Event)> {
        let (sidequest, event) =
            SidequestRepository::fetch_by_id_with_event(self.db_repo.conn(), sidequest_id).await?;

        Ok((sidequest.into(), event.into()))
    }

    pub async fn get_sidequest_by_slug_with_event(
        &self,
        event_slug: &str,
        sidequest_slug: &str,
    ) -> ServiceResult<(Sidequest, Event)> {
        let (sidequest, event) = SidequestRepository::fetch_by_slug_with_event(
            self.db_repo.conn(),
            event_slug,
            sidequest_slug,
        )
        .await?;

        Ok((sidequest.into(), event.into()))
    }

    pub async fn update_sidequest(
        &self,
        sidequest_id: Uuid,
        sidequest_fu: SidequestForUpdate,
    ) -> ServiceResult<Sidequest> {
        let txn = self.db_repo.conn().begin().await?;

        let sidequest = SidequestRepository::fetch_by_id(&txn, sidequest_id).await?;

        // Store for later use
        let event_id = sidequest.event_id;

        let mut active_sidequest = sidequest.into_active_model();

        if let Some(name) = sidequest_fu.name {
            let slug = self
                .generate_slug(&txn, event_id, &name, Some(sidequest_id))
                .await?;

            active_sidequest.name = Set(name.clone());
            active_sidequest.slug = Set(slug);
        }

        if let Some(description) = sidequest_fu.description {
            active_sidequest.description = Set(description);
        }

        if let Some(is_higher_result_better) = sidequest_fu.is_higher_result_better {
            active_sidequest.is_higher_result_better = Set(is_higher_result_better);
        }

        let sidequest = active_sidequest.update(&txn).await?;

        txn.commit().await?;

        Ok(sidequest.into())
    }

    pub async fn delete_sidequest(&self, sidequest_id: Uuid) -> ServiceResult<()> {
        let sidequest = SidequestRepository::fetch_by_id(self.db_repo.conn(), sidequest_id).await?;

        let txn = self.db_repo.conn().begin().await?;

        let sidequest_attempts = sidequest
            .find_related(db_sidequest_attempt::Entity)
            .count(&txn)
            .await?;

        if sidequest_attempts > 0 {
            return Err(ServiceError::ResourceStillInUse {
                resource: "Sidequest".to_string(),
                id: sidequest_id.to_string(),
            });
        }

        sidequest.delete(&txn).await?;
        txn.commit().await?;

        Ok(())
    }

    pub async fn create_attempt(&self, attempt_fc: AttemptForCreate) -> ServiceResult<Attempt> {
        let sidequest =
            SidequestRepository::fetch_by_id(self.db_repo.conn(), attempt_fc.sidequest_id).await?;

        AuthorizationService::ensure_event_groups(
            self.db_repo.conn(),
            sidequest.event_id,
            &[(attempt_fc.user_id, Group::EventParticipant)],
        )
        .await?;

        let cooldown = self
            .get_cooldown(sidequest.event_id, attempt_fc.user_id)
            .await?;

        if let Some(next_attempt) = cooldown.next_attempt {
            return Err(ServiceError::SidequestCooldown {
                expires_at: next_attempt,
            });
        }

        let active_attempt = db_sidequest_attempt::ActiveModel {
            sidequest_id: Set(attempt_fc.sidequest_id),
            user_id: Set(attempt_fc.user_id),
            result: Set(attempt_fc.result),
            attempted_at: Set(Utc::now().naive_utc()),
            ..Default::default()
        };

        let attempt = active_attempt.insert(self.db_repo.conn()).await?;

        Ok(attempt.into())
    }

    pub async fn get_attempts(
        &self,
        event_id: Uuid,
        after: Option<NaiveDateTime>,
        before: Option<NaiveDateTime>,
    ) -> ServiceResult<Vec<Attempt>> {
        let attempts = SidequestAttemptRepository::fetch_all_by_event_id(
            self.db_repo.conn(),
            event_id,
            after,
            before,
        )
        .await?;

        let attempts = attempts.into_iter().map(Attempt::from).collect();

        Ok(attempts)
    }

    pub async fn get_attempts_by_sidequest(
        &self,
        event_id: Uuid,
        sidequest_id: Uuid,
        after: Option<NaiveDateTime>,
        before: Option<NaiveDateTime>,
    ) -> ServiceResult<Vec<Attempt>> {
        SidequestRepository::fetch_by_id_and_event_id(self.db_repo.conn(), sidequest_id, event_id)
            .await?;

        let attempts = SidequestAttemptRepository::fetch_all_by_sidequest_id(
            self.db_repo.conn(),
            sidequest_id,
            after,
            before,
        )
        .await?;

        let attempts = attempts.into_iter().map(Attempt::from).collect();

        Ok(attempts)
    }

    pub async fn get_attempts_by_team(
        &self,
        event_id: Uuid,
        team_id: Uuid,
        after: Option<NaiveDateTime>,
        before: Option<NaiveDateTime>,
    ) -> ServiceResult<Vec<Attempt>> {
        TeamRepository::fetch_by_id_and_event_id(self.db_repo.conn(), team_id, event_id).await?;

        let attempts = SidequestAttemptRepository::fetch_all_by_team_id(
            self.db_repo.conn(),
            team_id,
            after,
            before,
        )
        .await?;

        let attempts = attempts.into_iter().map(Attempt::from).collect();

        Ok(attempts)
    }

    pub async fn get_attempts_by_user(
        &self,
        user_id: Uuid,
        event_id: Uuid,
        after: Option<NaiveDateTime>,
        before: Option<NaiveDateTime>,
    ) -> ServiceResult<Vec<Attempt>> {
        let attempts = SidequestAttemptRepository::fetch_all_by_event_user_id(
            self.db_repo.conn(),
            event_id,
            user_id,
            after,
            before,
        )
        .await?;

        let attempts = attempts.into_iter().map(Attempt::from).collect();

        Ok(attempts)
    }

    pub async fn get_attempt_with_event(
        &self,
        attempt_id: Uuid,
    ) -> ServiceResult<(Attempt, Event)> {
        let (attempt, event) =
            SidequestAttemptRepository::fetch_by_id_with_event(self.db_repo.conn(), attempt_id)
                .await?;

        Ok((attempt.into(), event.into()))
    }

    pub async fn update_attempt(
        &self,
        attempt_id: Uuid,
        attempt_fu: AttemptForUpdate,
    ) -> ServiceResult<Attempt> {
        let attempt =
            SidequestAttemptRepository::fetch_by_id(self.db_repo.conn(), attempt_id).await?;
        let mut active_attempt = attempt.into_active_model();

        if let Some(result) = attempt_fu.result {
            active_attempt.result = Set(result);
        }

        let attempt = active_attempt.update(self.db_repo.conn()).await?;

        Ok(attempt.into())
    }

    pub async fn delete_attempt(&self, attempt_id: Uuid) -> ServiceResult<()> {
        let attempt =
            SidequestAttemptRepository::fetch_by_id(self.db_repo.conn(), attempt_id).await?;
        attempt.delete(self.db_repo.conn()).await?;
        Ok(())
    }

    pub async fn get_cooldown(&self, event_id: Uuid, user_id: Uuid) -> ServiceResult<Cooldown> {
        let (event, last_attempt) = try_join!(
            EventRepository::fetch_by_id(self.db_repo.conn(), event_id),
            SidequestAttemptRepository::fetch_latest_by_event_user_id_opt(
                self.db_repo.conn(),
                event_id,
                user_id,
            ),
        )?;

        let duration = chrono::Duration::minutes(i64::from(event.sidequest_cooldown));

        let last_attempt = last_attempt.map(|attempt| attempt.attempted_at);

        let next_attempt = last_attempt.and_then(|last_attempt| {
            let now = Utc::now().naive_utc();
            let next_attempt = last_attempt + duration;
            if now < next_attempt {
                Some(next_attempt)
            } else {
                None
            }
        });

        let cooldown = Cooldown {
            duration: event.sidequest_cooldown as u32,
            last_attempt,
            next_attempt,
        };

        Ok(cooldown)
    }

    pub async fn run_aggregator(&self, event_id: Uuid) -> ServiceResult<HashMap<Uuid, f64>> {
        let now = Utc::now().naive_utc();
        let event = EventRepository::fetch_by_id(self.db_repo.conn(), event_id).await?;

        if event.phase != EventPhase::Hacking {
            return Err(ServiceError::EventPhase {
                current_phase: event.phase,
            });
        }

        let input = ranking::input::load_sidequest_input(self.db_repo.conn(), event_id).await?;

        // `sidequest_team_scores` gives every team a 0 without sidequests; don't store those
        if input.sidequests.is_empty() {
            return Ok(HashMap::new());
        }

        let scores = ranking::compute::sidequest_team_scores(&input);

        let active_scores = scores
            .iter()
            .map(|(team_id, score)| db_sidequest_score::ActiveModel {
                team_id: Set(*team_id),
                score: Set(*score),
                valid_at: Set(now),
                ..Default::default()
            });

        db_sidequest_score::Entity::insert_many(active_scores)
            .on_empty_do_nothing()
            .exec(self.db_repo.conn())
            .await?;

        Ok(scores)
    }

    pub async fn get_leaderboard(
        &self,
        event_id: Uuid,
    ) -> ServiceResult<Vec<TeamLeaderboardEntry>> {
        let latest_valid_at: Option<NaiveDateTime> = db_sidequest_score::Entity::find()
            .select_only()
            .column_as(
                Expr::col((
                    db_sidequest_score::Entity,
                    db_sidequest_score::Column::ValidAt,
                ))
                .max(),
                "valid_at",
            )
            .inner_join(db_team::Entity)
            .filter(db_team::Column::EventId.eq(event_id))
            .into_tuple()
            .one(self.db_repo.conn())
            .await?
            .flatten();

        // teams without a score in the latest snapshot get 0
        // (if there is no snapshot at all, `valid_at = NULL` matches nothing)
        let score: SimpleExpr = Func::coalesce([
            Expr::col((
                db_sidequest_score::Entity,
                db_sidequest_score::Column::Score,
            ))
            .into(),
            Expr::val(0.0).into(),
        ])
        .into();

        let entries = db_team::Entity::find()
            .select_only()
            .column_as(db_team::Column::Id, "team_id")
            .column_as(db_team::Column::Name, "team_name")
            .column_as(score.clone(), "score")
            .join(
                JoinType::LeftJoin,
                db_team::Relation::SidequestScore
                    .def()
                    .on_condition(move |_team, score| {
                        Expr::col((score, db_sidequest_score::Column::ValidAt))
                            .eq(latest_valid_at)
                            .into_condition()
                    }),
            )
            .filter(db_team::Column::EventId.eq(event_id))
            .order_by_desc(score)
            .into_model::<TeamLeaderboardEntry>()
            .all(self.db_repo.conn())
            .await?;

        Ok(entries)
    }

    pub async fn get_sidequest_leaderboard_by_user(
        &self,
        event_id: Uuid,
        sidequest_id: Uuid,
    ) -> ServiceResult<Vec<UserLeaderboardEntry>> {
        let sidequest = SidequestRepository::fetch_by_id_and_event_id(
            self.db_repo.conn(),
            sidequest_id,
            event_id,
        )
        .await?;
        let (best_results, users) = try_join!(
            SidequestAttemptRepository::fetch_best_results_by_event_id(
                self.db_repo.conn(),
                sidequest.event_id,
            )
            .err_into(),
            self.authorization_service
                .get_event_affiliates(sidequest.event_id, Some(EventRole::Participant)),
        )?;
        let participant_count = users.len() as u64;

        let user_mapping = users
            .into_iter()
            .map(|user| (user.id, user))
            .collect::<HashMap<_, _>>();

        let entries =
            ranking::compute::sidequest_user_points(&sidequest, &best_results, participant_count)
                .into_iter()
                .filter_map(|user_points| {
                    let user = user_mapping.get(&user_points.user_id)?;

                    Some(UserLeaderboardEntry {
                        user_id: user_points.user_id,
                        user_name: user.name.clone(),
                        points: user_points.points,
                        result: user_points.result,
                    })
                })
                .collect();

        Ok(entries)
    }

    pub async fn get_history(
        &self,
        event_id: Uuid,
        after: Option<NaiveDateTime>,
        before: Option<NaiveDateTime>,
    ) -> ServiceResult<HashMap<Uuid, Vec<HistoryEntry>>> {
        let scores = db_sidequest_score::Entity::find()
            .inner_join(db_team::Entity)
            .filter(db_team::Column::EventId.eq(event_id))
            .apply_if(after, |q, v| {
                q.filter(db_sidequest_score::Column::ValidAt.gt(v))
            })
            .apply_if(before, |q, v| {
                q.filter(db_sidequest_score::Column::ValidAt.lt(v))
            })
            .order_by_asc(db_sidequest_score::Column::ValidAt)
            .all(self.db_repo.conn())
            .await?;

        let scores = scores.into_iter().fold(HashMap::new(), |mut acc, score| {
            let entry: &mut Vec<HistoryEntry> = acc.entry(score.team_id).or_default();

            entry.push(HistoryEntry {
                date: score.valid_at,
                score: score.score,
            });

            acc
        });

        Ok(scores)
    }

    async fn generate_slug<C: ConnectionTrait>(
        &self,
        db: &C,
        event_id: Uuid,
        name: &str,
        current_sidequest_id: Option<Uuid>,
    ) -> ServiceResult<String> {
        let slug = slugify(name);

        let conflicting = SidequestRepository::count_conflicting_by_slug(
            db,
            &slug,
            event_id,
            current_sidequest_id,
        )
        .await?;

        if conflicting != 0 {
            return Err(ServiceError::SlugNotUnique { slug });
        }

        Ok(slug)
    }
}
