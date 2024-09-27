pub mod model;
use std::collections::HashMap;

use crate::event::EventService;
use crate::user::model::UserForCreate;
use crate::user::UserService;
use crate::utils::try_insert_result_to_int;
use crate::{sidequest, ServiceError, ServiceResult};
use chrono::{NaiveDateTime, Utc};
use model::{
    AttemptForCreate, SidequestEntryForLeaderboard, SidequestForCreate, SidequestForPatch,
};
use repositories::db::prelude::*;
use repositories::DbRepository;
use sea_orm::sea_query::OnConflict;
use sea_orm::sqlx::types::time;
use sea_orm::Set;
use sea_orm::{prelude::*, IntoActiveModel, QueryOrder, QuerySelect};
use slug::slugify;

#[derive(Clone)]
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

        println!(
            "number of participants for leaderboard {}",
            num_participants
        );

        let result = leaderboard.into_iter().fold(
            (
                Vec::<SidequestEntryForLeaderboard>::new(),
                Vec::<SidequestEntryForLeaderboard>::new(),
                None::<f64>,
                num_participants,
            ),
            |(mut list, mut same_score, best_score, mut rank), mut entry| {
                if let Some(best_score) = best_score {
                    if entry.result == best_score {
                        // There is a tie
                        rank -= 1;
                        same_score.push(entry);
                        (list, same_score, Some(best_score), rank)
                    } else {
                        let mut same_score = same_score
                            .into_iter()
                            .map(|mut entry| {
                                entry.points = Some(rank);
                                entry
                            })
                            .collect::<Vec<_>>();
                        rank -= 1;
                        list.extend(same_score.clone());
                        same_score.clear();
                        entry.points = Some(rank);
                        list.push(entry.clone());
                        (list, same_score, Some(entry.result), rank)
                    }
                } else {
                    // The first Element in list.
                    rank -= 1;
                    entry.points = Some(rank);
                    same_score.push(entry.clone());
                    (list, same_score, Some(entry.result), rank)
                }
            },
        );

        let (mut result, ties, _, rank) = result;

        result.extend(
            ties.into_iter()
                .map(|mut entry| {
                    entry.points = Some(rank);
                    entry
                })
                .collect::<Vec<_>>(),
        );

        Ok(result)
    }

    pub async fn aggregate(&self, event_id: Uuid) -> ServiceResult<()> {
        let time_now = Utc::now().naive_utc();
        let event_service = EventService::new(self.db_repo.clone());
        let user_service = UserService::new(self.db_repo.clone());
        let event: db_event::Model = event_service.get_event(event_id).await?;

        if (event.phase != EventPhase::Hacking) {
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
                let group_id = team_mapping.get(&result.user_id);
                match group_id {
                    None => (),
                    Some(group_id) => {
                        let previous_points = team_points.get(group_id).copied().unwrap_or(0);
                        team_points.insert(*group_id, previous_points + result.points.unwrap_or(0));
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
}
