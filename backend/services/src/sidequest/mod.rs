pub mod model;
use crate::event::EventService;
use crate::user::UserService;
use crate::{ServiceError, ServiceResult};
use chrono::{NaiveDateTime, Utc};
use model::{
    AggregatorStatus, AttemptForCreate, FullInfoSidequestEntryForLeaderboard,
    FullInfoTeamEntryForLeaderboard, LoopStatus, SidequestEntryForLeaderboard, SidequestForCreate,
    SidequestForPatch, TeamEntryForLeaderboard, TeamLatestResult, TimelineData,
    UserWithSidequestInfo,
};
use repositories::db::prelude::*;
use repositories::DbRepository;
use sea_orm::sea_query::{OnConflict, Query};
use std::collections::HashMap;
use std::time::Duration;
use tokio::time;
use tokio_tasks::RunToken;

use sea_orm::{
    prelude::*, DbBackend, EntityOrSelect, IntoActiveModel, QueryOrder, QuerySelect, QueryTrait,
};
use sea_orm::{Order, Set};
use slug::slugify;

pub struct SidequestService {
    db_repo: DbRepository,
}

impl SidequestService {
    pub fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn create_sidequest(&self, sidequest: SidequestForCreate) -> ServiceResult<u64> {
        let active_sidequest = db_sidequest::ActiveModel {
            event_id: Set(sidequest.event_id),
            name: Set(sidequest.name.clone()),
            description: Set(sidequest.description),
            is_higher_result_better: Set(sidequest.is_higher_result_better),
            slug: Set(slugify(&sidequest.name)),
            ..Default::default()
        };

        let result = db_sidequest::Entity::insert(active_sidequest)
            .exec_without_returning(self.db_repo.conn())
            .await?;

        Ok(result)
    }

    pub async fn get_sidequests(&self, event_id: Uuid) -> ServiceResult<Vec<db_sidequest::Model>> {
        let sidequests = db_sidequest::Entity::find()
            .filter(db_sidequest::Column::EventId.eq(event_id))
            .all(self.db_repo.conn())
            .await?;
        Ok(sidequests)
    }

    pub async fn get_sidequest(&self, sidequest_id: Uuid) -> ServiceResult<db_sidequest::Model> {
        let sidequest = db_sidequest::Entity::find_by_id(sidequest_id)
            .one(self.db_repo.conn())
            .await?;

        let sidequest = sidequest.ok_or(ServiceError::ResourceNotFound {
            resource: ("sidequest".to_string()),
            id: (sidequest_id.to_string()),
        })?;
        Ok(sidequest)
    }

    pub async fn patch_sidequest(
        &self,
        sidequest_id: Uuid,
        patch: SidequestForPatch,
    ) -> ServiceResult<db_sidequest::Model> {
        let sidequest = db_sidequest::Entity::find()
            .filter(db_sidequest::Column::Id.eq(sidequest_id))
            .filter(db_sidequest::Column::EventId.eq(patch.event_id))
            .one(self.db_repo.conn())
            .await?;

        let sidequest = sidequest.ok_or(ServiceError::ResourceNotFound {
            resource: ("sidequest".to_string()),
            id: (sidequest_id.to_string()),
        })?;

        let mut active_sidequest = sidequest.into_active_model();

        if let Some(name) = &patch.name {
            active_sidequest.name = Set(name.clone());
            active_sidequest.slug = Set(slugify(name));
        }

        if let Some(description) = &patch.description {
            active_sidequest.description = Set(description.clone());
        }

        if let Some(is_higher_result_better) = &patch.is_higher_result_better {
            active_sidequest.is_higher_result_better = Set(*is_higher_result_better);
        }

        let result = db_sidequest::Entity::update(active_sidequest)
            .exec(self.db_repo.conn())
            .await?;
        Ok(result)
    }

    pub async fn add_attempt(
        &self,
        sidequest_id: Uuid,
        attempt: AttemptForCreate,
    ) -> ServiceResult<u64> {
        let active_attempt = db_sidequest_attempt::ActiveModel {
            sidequest_id: Set(sidequest_id),
            user_id: Set(attempt.user_id),
            result: Set(attempt.result),
            attempted_at: Set(Utc::now().naive_utc()),
            ..Default::default()
        };

        let result = db_sidequest_attempt::Entity::insert(active_attempt)
            .exec_without_returning(self.db_repo.conn())
            .await?;

        Ok(result)
    }

    pub async fn delete_attempt(&self, attempt_id: Uuid) -> ServiceResult<u64> {
        let attempt = db_sidequest_attempt::Entity::find_by_id(attempt_id)
            .one(self.db_repo.conn())
            .await?;

        let attempt = attempt.ok_or(ServiceError::ResourceNotFound {
            resource: ("attempt".to_string()),
            id: (attempt_id.to_string()),
        })?;

        let result = attempt.delete(self.db_repo.conn()).await?;

        Ok(result.rows_affected)
    }

    pub async fn get_event(&self, sidequest_id: Uuid) -> ServiceResult<db_event::Model> {
        let sidequest = db_sidequest::Entity::find()
            .filter(db_sidequest::Column::Id.eq(sidequest_id))
            .one(self.db_repo.conn())
            .await?;

        let sidequest = sidequest.ok_or(ServiceError::ResourceNotFound {
            resource: ("sidequest".to_string()),
            id: (sidequest_id.to_string()),
        })?;

        let event = db_event::Entity::find()
            .filter(db_event::Column::Id.eq(sidequest.event_id))
            .one(self.db_repo.conn())
            .await?;

        let event = event.ok_or(ServiceError::ResourceNotFound {
            resource: ("event".to_string()),
            id: (sidequest.event_id.to_string()),
        })?;

        Ok(event)
    }

    pub async fn get_team_leaderboard(
        &self,
        event_id: Uuid,
    ) -> ServiceResult<Vec<FullInfoTeamEntryForLeaderboard>> {
        let user_service = UserService::new(self.db_repo.clone());
        let team_mapping: HashMap<Uuid, db_team::Model> =
            user_service.get_team_mapping(event_id).await?;

        let team_ids = team_mapping
            .values()
            .cloned()
            .map(|team| team.id)
            .collect::<Vec<_>>();

        let latest = db_sidequest_score::Entity::find()
            .select_only()
            .column_as(db_sidequest_score::Column::ValidAt.max(), "valid_at_max")
            .column(db_sidequest_score::Column::TeamId)
            .group_by(db_sidequest_score::Column::TeamId)
            .into_model::<TeamLatestResult>()
            .all(self.db_repo.conn())
            .await?;

        let mut team_scores = Vec::<db_sidequest_score::Model>::new();
        for newest in latest {
            let team_id = newest.team_id;
            if (newest.valid_at_max.is_none()) {
                continue;
            }
            let valid_at_max = newest.valid_at_max.unwrap();
            let score = db_sidequest_score::Entity::find()
                .filter(db_sidequest_score::Column::TeamId.eq(team_id))
                .filter(db_sidequest_score::Column::ValidAt.eq(valid_at_max))
                .one(self.db_repo.conn())
                .await?;
            if let Some(score) = score {
                team_scores.push(score);
            }
        }

        let mut points_rank_mapping = HashMap::<i64, i64>::new();
        let mut rank = 1;
        for team in &team_scores {
            points_rank_mapping.insert(team.score as i64, rank);
            rank += 1;
        }

        let mut result = Vec::<FullInfoTeamEntryForLeaderboard>::new();
        for team_score in team_scores {
            // let team = team_mapping.get(&team_score.team_id);
            let team = team_score
                .find_related(db_team::Entity)
                .one(self.db_repo.conn())
                .await?;
            let rank = points_rank_mapping.get(&(team_score.score as i64));

            if team.is_none() || rank.is_none() {
                continue;
            }

            result.push(FullInfoTeamEntryForLeaderboard {
                group_name: team.unwrap().name.clone(),
                group_id: team_score.team_id,
                result: team_score.score as f64,
                rank: *rank.unwrap(),
            });
        }

        result.sort_by(|a, b| a.rank.cmp(&b.rank));

        Ok(result)
    }

    pub async fn get_timeline(
        &self,
        event_id: Uuid,
        before: Option<NaiveDateTime>,
        after: Option<NaiveDateTime>,
    ) -> ServiceResult<TimelineData> {
        let user_service = UserService::new(self.db_repo.clone());
        let user_team_mapping: HashMap<Uuid, db_team::Model> =
            user_service.get_team_mapping(event_id).await?;

        let team_ids = user_team_mapping
            .values()
            .cloned()
            .map(|team| team.id)
            .collect::<Vec<_>>();

        let mut team_names = HashMap::<Uuid, String>::new();
        for team_id in team_ids.clone() {
            db_team::Entity::find_by_id(team_id)
                .one(self.db_repo.conn())
                .await?
                .map(|team| team_names.insert(team_id, team.slug));
        }

        let scores_query = db_sidequest_score::Entity::find()
            .filter(db_sidequest_score::Column::TeamId.is_in(team_ids.clone()))
            .order_by(db_sidequest_score::Column::ValidAt, Order::Asc)
            .all(self.db_repo.conn())
            .await?;

        // This map will map valid_at -> team_id -> score
        let mut scores = HashMap::<String, Vec<(NaiveDateTime, i64)>>::new();

        for score in scores_query {
            let team_id = score.team_id;
            let valid_at = score.valid_at;
            let score = score.score;
            let team_name = team_names
                .get(&team_id)
                .unwrap_or(&"Unknown".to_string())
                .clone();
            let list = scores.entry(team_name).or_default();
            list.push((valid_at, score as i64));
        }

        let result = TimelineData {
            event_id,
            start: after,
            end: before,
            scores,
        };
        Ok(result)
    }

    pub async fn get_full_leaderboard(
        &self,
        sidequest_id: Uuid,
    ) -> ServiceResult<Vec<FullInfoSidequestEntryForLeaderboard>> {
        let event = self.get_event(sidequest_id).await?;
        let leaderboard = self.get_leaderboard(sidequest_id).await?;

        let user_service = UserService::new(self.db_repo.clone());
        let team_mapping = user_service.get_team_mapping(event.id).await?;
        let user_mapping = user_service.get_participants_mapping(event.id).await?;

        let result = leaderboard
            .into_iter()
            .map(|entry| {
                let team = team_mapping.get(&entry.user_id);
                let user = user_mapping.get(&entry.user_id);

                let (user_id, user_name) = match user {
                    None => (entry.user_id, "Unknown".to_string()),
                    Some(user) => (user.id, user.name.clone()),
                };
                let (group_id, group_name) = match team {
                    None => (Uuid::nil(), "Unknown".to_string()),
                    Some(team) => (team.id, team.name.clone()),
                };

                return FullInfoSidequestEntryForLeaderboard {
                    user_name: user_name,
                    user_id: user_id,
                    group_name: group_name,
                    group_id: group_id,
                    result: entry.result,
                    points: entry.points.unwrap_or(0),
                };
            })
            .collect::<Vec<_>>();
        Ok(result)
    }

    pub async fn get_leaderboard(
        &self,
        sidequest_id: Uuid,
    ) -> ServiceResult<Vec<SidequestEntryForLeaderboard>> {
        let event = self.get_event(sidequest_id).await?;

        let sidequest = self.get_sidequest(sidequest_id).await?;
        let mut query = db_sidequest_attempt::Entity::find()
            .filter(db_sidequest_attempt::Column::SidequestId.eq(sidequest_id))
            .select_only();

        if sidequest.is_higher_result_better {
            query = query.column_as(db_sidequest_attempt::Column::Result.max(), "result");
            query = query.order_by_desc(db_sidequest_attempt::Column::Result.max());
        } else {
            query = query.column_as(db_sidequest_attempt::Column::Result.min(), "result");
            query = query.order_by_asc(db_sidequest_attempt::Column::Result.min());
        }

        let leaderboard = query
            .column_as(db_sidequest_attempt::Column::UserId, "user_id")
            .group_by(db_sidequest_attempt::Column::UserId)
            .into_model::<SidequestEntryForLeaderboard>()
            .all(self.db_repo.conn())
            .await?;

        let num_participants = (UserService::new(self.db_repo.clone())
            .get_participants(event.id)
            .await?
            .len()
            + 1) as i64;

        let mut points_to_rank = HashMap::<i64, i64>::new();
        let mut rank = 0;

        for entry in &leaderboard {
            points_to_rank.insert(entry.result as i64, rank);
            rank += 1;
        }

        let mut result = leaderboard
            .into_iter()
            .map(|mut entry| {
                entry.points = Some(
                    num_participants
                        - points_to_rank
                            .get(&(entry.result as i64))
                            .copied()
                            .unwrap_or(num_participants),
                );
                entry
            })
            .collect::<Vec<_>>();

        result.sort_by(|a, b| b.points.unwrap_or(0).cmp(&a.points.unwrap_or(0)));

        Ok(result)
    }

    pub async fn aggregate(&self, event_id: Uuid) -> ServiceResult<()> {
        let time_now = Utc::now().naive_utc();
        let event_service = EventService::new(self.db_repo.clone());
        let user_service = UserService::new(self.db_repo.clone());
        let event: db_event::Model = event_service.get_event(event_id).await?;

        if event.phase != EventPhase::Hacking {
            return Err(ServiceError::EventPhase {
                current_phase: (event.phase),
            });
        }

        let teams = Vec::<db_team::Model>::new(); // TODO this should come from database
        let sidequests = self.get_sidequests(event_id).await?;

        let team_mapping = user_service.get_team_mapping(event_id).await?;

        let mut team_points = HashMap::<Uuid, i64>::new();
        for team in teams {
            team_points.insert(team.id, 0);
        }
        for sidequest in sidequests {
            let leaderboard = self.get_leaderboard(sidequest.id).await?;
            for result in leaderboard {
                let team = team_mapping.get(&result.user_id);
                match team {
                    None => (),
                    Some(team) => {
                        let previous_points = team_points.get(&team.id).copied().unwrap_or(0);
                        team_points.insert(team.id, previous_points + result.points.unwrap_or(0));
                    }
                }
            }
        }
        for (team, score) in team_points {
            let record = db_sidequest_score::ActiveModel {
                score: Set(score.try_into().unwrap()),
                team_id: Set(team),
                valid_at: Set(time_now),
                ..Default::default()
            };
            record.insert(self.db_repo.conn()).await?;
        }
        Ok(())
    }

    pub async fn aggregate_infinite_loop(&self, event_id: Uuid, run_token: RunToken) {
        let db_repo = DbRepository::new(self.db_repo.conn.clone());
        let mut interval = time::interval(Duration::from_secs(5));
        let sidequest_service = SidequestService::new(db_repo.clone());
        loop {
            if run_token.is_cancelled() {
                println!("Aggregation (event : {}) stopped", event_id);
                break;
            }
            interval.tick().await;
            let res = sidequest_service.aggregate(event_id).await;
            match res {
                Err(err) => {
                    eprint!(
                        "Aggregation (event : {}) failed with error: {:?}",
                        event_id, err
                    );
                }
                Ok(_) => (),
            }
        }
    }

    pub async fn aggregate_start(&self, event_id: Uuid) {
        let sidequest_service = SidequestService::new(self.db_repo.clone());
        let _ =
            tokio_tasks::TaskBuilder::new(event_id.to_string()).create(|run_token| async move {
                sidequest_service
                    .aggregate_infinite_loop(event_id, run_token)
                    .await;
                Result::<(), ()>::Ok(())
            });
    }

    pub async fn aggregate_stop(&self, event_id: Uuid) -> ServiceResult<()> {
        let tasks = tokio_tasks::list_tasks();
        let task = tasks
            .into_iter()
            .find(|task| task.name() == event_id.to_string());
        match task {
            None => Err(ServiceError::ResourceNotFound {
                resource: ("aggregation task".to_string()),
                id: (event_id.to_string()),
            }),
            Some(task) => {
                let res = task.cancel().await;
                Ok(())
            }
        }
    }

    pub async fn aggregate_status(&self, event_id: Uuid) -> ServiceResult<AggregatorStatus> {
        let tasks = tokio_tasks::list_tasks();
        let task = tasks
            .into_iter()
            .find(|task| task.name() == event_id.to_string());
        match task {
            None => Ok(AggregatorStatus {
                event_id,
                status: LoopStatus::NonExisting,
            }),
            Some(_) => Ok(AggregatorStatus {
                event_id,
                status: LoopStatus::Running,
            }),
        }
    }

    pub async fn aggregate_start_all(&mut self) -> ServiceResult<()> {
        let event_service = EventService::new(self.db_repo.clone());
        let events = event_service.get_events().await?;
        for event in events {
            let event_id = event.id;
            self.aggregate_start(event_id).await;
        }
        Ok(())
    }

    pub async fn aggregate_stop_all(&mut self) -> ServiceResult<()> {
        let event_service = EventService::new(self.db_repo.clone());
        let events = event_service.get_events().await?;
        for event in events {
            let event_id = event.id;
            self.aggregate_stop(event_id).await?;
        }
        Ok(())
    }

    pub async fn get_participant_with_sidequest_info_by_id(
        &self,
        event_id: Uuid,
        user_id: Uuid,
    ) -> ServiceResult<UserWithSidequestInfo> {
        let user_service = UserService::new(self.db_repo.clone());
        let participant = user_service.get_user(user_id).await?;
        self.get_participant_with_sidequest_info(event_id, participant)
            .await
    }

    pub async fn get_participant_with_sidequest_info(
        &self,
        event_id: Uuid,
        participant: db_user::Model,
    ) -> ServiceResult<UserWithSidequestInfo> {
        let event_service = EventService::new(self.db_repo.clone());
        let event = event_service.get_event(event_id).await?;
        let last_quest = db_sidequest_attempt::Entity::find()
            .filter(db_sidequest_attempt::Column::UserId.eq(participant.id))
            .order_by_desc(db_sidequest_attempt::Column::AttemptedAt)
            .one(self.db_repo.conn())
            .await?;

        let now = Utc::now().naive_utc();
        match last_quest {
            None => Ok(UserWithSidequestInfo {
                user_id: participant.id,
                user_name: participant.name,
                last_quest: None,
                allowed: true && event.phase == EventPhase::Hacking,
                allowed_at: Some(now),
            }),
            Some(last_quest) => {
                let allowed_time = last_quest.attempted_at + chrono::Duration::minutes(60); // TODO this should come from database
                let allowed = now > allowed_time && event.phase == EventPhase::Hacking;
                Ok(UserWithSidequestInfo {
                    user_id: participant.id,
                    user_name: participant.name,
                    last_quest: Some(last_quest.attempted_at),
                    allowed: allowed,
                    allowed_at: if event.phase == EventPhase::Hacking {
                        Some(allowed_time)
                    } else {
                        None
                    },
                })
            }
        }
    }

    pub async fn get_participants_with_sidequest_info(
        &self,
        event_id: Uuid,
    ) -> ServiceResult<Vec<UserWithSidequestInfo>> {
        let user_service = UserService::new(self.db_repo.clone());
        let participants: Vec<db_user::Model> = user_service.get_participants(event_id).await?;
        let mut result = Vec::<UserWithSidequestInfo>::new();

        for participant in participants {
            result.push(
                self.get_participant_with_sidequest_info(event_id, participant)
                    .await?,
            );
        }

        Ok(result)
    }
}
