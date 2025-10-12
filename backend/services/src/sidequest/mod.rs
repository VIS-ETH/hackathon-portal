pub mod models;

use crate::{ServiceError, ServiceResult};
use chrono::{NaiveDateTime, Utc};
use hackathon_portal_repositories::DbRepository;
use models::{AttemptForCreate, SidequestForCreate, SidequestForUpdate};
use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use crate::authorization::AuthorizationService;
use crate::sidequest::models::{
    Attempt, AttemptForUpdate, Cooldown, HistoryEntry, Sidequest, TeamLeaderboardEntry,
    UserLeaderboardEntry,
};
use hackathon_portal_repositories::db::{
    db_sidequest, db_sidequest_attempt, db_sidequest_score, db_team, EventPhase, EventRepository,
    EventRole, SidequestAttemptRepository, SidequestRepository, TeamRepository, TeamRole,
};
use sea_orm::Set;
use sea_orm::{
    prelude::*, FromQueryResult, IntoActiveModel, QueryOrder, QuerySelect, QueryTrait,
    TransactionTrait,
};
use slug::slugify;

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

    pub async fn get_sidequest(&self, sidequest_id: Uuid) -> ServiceResult<Sidequest> {
        let sidequest = SidequestRepository::fetch_by_id(self.db_repo.conn(), sidequest_id).await?;
        Ok(sidequest.into())
    }

    pub async fn get_sidequest_by_slug(
        &self,
        event_slug: &str,
        sidequest_slug: &str,
    ) -> ServiceResult<Sidequest> {
        let sidequest =
            SidequestRepository::fetch_by_slug(self.db_repo.conn(), event_slug, sidequest_slug)
                .await?;

        Ok(sidequest.into())
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
        sidequest_id: Uuid,
        after: Option<NaiveDateTime>,
        before: Option<NaiveDateTime>,
    ) -> ServiceResult<Vec<Attempt>> {
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
        team_id: Uuid,
        after: Option<NaiveDateTime>,
        before: Option<NaiveDateTime>,
    ) -> ServiceResult<Vec<Attempt>> {
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

    pub async fn get_attempt(&self, attempt_id: Uuid) -> ServiceResult<Attempt> {
        let attempt =
            SidequestAttemptRepository::fetch_by_id(self.db_repo.conn(), attempt_id).await?;
        Ok(attempt.into())
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
        let event = EventRepository::fetch_by_id(self.db_repo.conn(), event_id).await?;
        let duration = chrono::Duration::minutes(i64::from(event.sidequest_cooldown));

        let last_attempt = SidequestAttemptRepository::fetch_latest_by_event_user_id_opt(
            self.db_repo.conn(),
            event_id,
            user_id,
        )
        .await?;

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

    /// `sidequest_id` -> (`user_id` -> (`score`, `result`))
    async fn aggregate_sidequest_scores_by_user(
        &self,
        sidequest: &Sidequest,
    ) -> ServiceResult<HashMap<Uuid, (u64, f64)>> {
        #[derive(FromQueryResult)]
        struct UserResult {
            user_id: Uuid,
            best_result: f64,
        }

        let mut query = db_sidequest_attempt::Entity::find()
            .filter(db_sidequest_attempt::Column::SidequestId.eq(sidequest.id))
            .select_only()
            .column(db_sidequest_attempt::Column::UserId)
            .group_by(db_sidequest_attempt::Column::UserId);

        query = if sidequest.is_higher_result_better {
            query
                .column_as(db_sidequest_attempt::Column::Result.max(), "best_result")
                .order_by_desc(db_sidequest_attempt::Column::Result.max())
        } else {
            query
                .column_as(db_sidequest_attempt::Column::Result.min(), "best_result")
                .order_by_asc(db_sidequest_attempt::Column::Result.min())
        };

        let results = query
            .into_model::<UserResult>()
            .all(self.db_repo.conn())
            .await?;

        let mut current_score = self
            .authorization_service
            .count_event_affiliates(sidequest.event_id, Some(EventRole::Participant))
            .await?;
        let mut result_to_score = HashMap::new();

        for result in &results {
            // WARN: to_string() is a big hack since f64 doesn't implement Eq
            result_to_score.insert(result.best_result.to_string(), current_score);
            current_score = current_score.saturating_sub(1); // Clamp to 0, avoid overflow
        }

        let mut user_scores = HashMap::new();

        for result in results {
            user_scores.insert(
                result.user_id,
                (
                    result_to_score[&result.best_result.to_string()],
                    result.best_result,
                ),
            );
        }

        Ok(user_scores)
    }

    /// `sidequest_id` -> (`team_id` -> `score`)
    async fn aggregate_sidequest_scores_by_team(
        &self,
        sidequest: &Sidequest,
    ) -> ServiceResult<HashMap<Uuid, f64>> {
        let teams =
            TeamRepository::fetch_all_by_event_id(self.db_repo.conn(), sidequest.event_id).await?;

        let user_scores = self.aggregate_sidequest_scores_by_user(sidequest).await?;
        let mut team_scores = HashMap::new();

        for team in teams {
            let members = self
                .authorization_service
                .get_team_affiliates(team.id, Some(TeamRole::Member))
                .await?;

            for member in &members {
                if let Some((score, _)) = user_scores.get(&member.id) {
                    *team_scores.entry(team.id).or_insert(0.0) += *score as f64;
                }
            }

            if members.is_empty() {
                team_scores.insert(team.id, 0.0);
            } else {
                *team_scores.entry(team.id).or_insert(0.0) /= members.len() as f64;
            }
        }

        Ok(team_scores)
    }

    /// `event_id` -> (`team_id` -> `score`)
    pub async fn aggregate_scores(&self, event_id: Uuid) -> ServiceResult<HashMap<Uuid, f64>> {
        let sidequests = self.get_sidequests(event_id).await?;
        let mut scores = HashMap::new();

        for sidequest in sidequests {
            let sidequest_scores = self.aggregate_sidequest_scores_by_team(&sidequest).await?;
            for (team_id, sidequest_score) in sidequest_scores {
                *scores.entry(team_id).or_insert(0.0) += sidequest_score;
            }
        }

        Ok(scores)
    }

    pub async fn run_aggregator(&self, event_id: Uuid) -> ServiceResult<HashMap<Uuid, f64>> {
        let now = Utc::now().naive_utc();
        let event = EventRepository::fetch_by_id(self.db_repo.conn(), event_id).await?;

        if event.phase != EventPhase::Hacking {
            return Err(ServiceError::EventPhase {
                current_phase: event.phase,
            });
        }

        let scores = self.aggregate_scores(event_id).await?;

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
        let teams = TeamRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id).await?;

        let team_mapping = teams
            .iter()
            .map(|team| (team.id, team))
            .collect::<HashMap<_, _>>();

        let scores = self.aggregate_scores(event_id).await?;

        let mut seen = HashSet::new();
        let mut entries = Vec::new();

        for (team_id, team_score) in scores {
            let Some(team) = team_mapping.get(&team_id) else {
                continue;
            };

            let entry = TeamLeaderboardEntry {
                team_id,
                team_name: team.name.clone(),
                score: team_score,
            };

            seen.insert(team_id);
            entries.push(entry);
        }

        for team in teams {
            if seen.contains(&team.id) {
                continue;
            }

            let entry = TeamLeaderboardEntry {
                team_id: team.id,
                team_name: team.name.clone(),
                score: 0.0,
            };

            seen.insert(team.id);
            entries.push(entry);
        }

        entries.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(Ordering::Equal));

        Ok(entries)
    }

    pub async fn get_sidequest_leaderboard_by_team(
        &self,
        sidequest_id: Uuid,
    ) -> ServiceResult<Vec<TeamLeaderboardEntry>> {
        let sidequest = self.get_sidequest(sidequest_id).await?;

        let teams =
            TeamRepository::fetch_all_by_event_id(self.db_repo.conn(), sidequest.event_id).await?;

        let team_mapping = teams
            .into_iter()
            .map(|team| (team.id, team))
            .collect::<HashMap<_, _>>();

        let scores = self.aggregate_sidequest_scores_by_team(&sidequest).await?;

        let mut entries = scores
            .into_iter()
            .filter_map(|(team_id, score)| {
                let team = team_mapping.get(&team_id)?;

                Some(TeamLeaderboardEntry {
                    team_id,
                    team_name: team.name.clone(),
                    score,
                })
            })
            .collect::<Vec<_>>();

        entries.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(Ordering::Equal));

        Ok(entries)
    }

    pub async fn get_sidequest_leaderboard_by_user(
        &self,
        sidequest_id: Uuid,
    ) -> ServiceResult<Vec<UserLeaderboardEntry>> {
        let sidequest = self.get_sidequest(sidequest_id).await?;

        let users = self
            .authorization_service
            .get_event_affiliates(sidequest.event_id, Some(EventRole::Participant))
            .await?;

        let user_mapping = users
            .into_iter()
            .map(|user| (user.id, user))
            .collect::<HashMap<_, _>>();

        let scores = self.aggregate_sidequest_scores_by_user(&sidequest).await?;

        let mut entries = scores
            .into_iter()
            .filter_map(|(user_id, (score, result))| {
                let user = user_mapping.get(&user_id)?;

                Some(UserLeaderboardEntry {
                    user_id,
                    user_name: user.name.clone(),
                    score,
                    result,
                })
            })
            .collect::<Vec<_>>();

        entries.sort_by(|a, b| b.score.cmp(&a.score));

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
