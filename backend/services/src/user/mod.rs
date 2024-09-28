pub mod model;

use std::collections::HashMap;

use crate::user::model::UserForCreate;
use crate::utils::try_insert_result_to_int;
use crate::{ServiceError, ServiceResult};
use repositories::db::prelude::*;
use repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::sea_query::OnConflict;
use sea_orm::Set;

#[derive(Clone)]
pub struct UserService {
    db_repo: DbRepository,
}

impl UserService {
    pub fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn create_users(&self, users: Vec<UserForCreate>) -> ServiceResult<u64> {
        let active_users = users.into_iter().map(|user| {
            let name = user
                .name
                .clone()
                .unwrap_or_else(|| self.get_default_name(&user.auth_id));

            db_user::ActiveModel {
                auth_id: Set(user.auth_id),
                name: Set(name),
                ..Default::default()
            }
        });

        let result = db_user::Entity::insert_many(active_users)
            .on_conflict(
                OnConflict::columns(vec![db_user::Column::AuthId])
                    .do_nothing()
                    .to_owned(),
            )
            .on_empty_do_nothing()
            .exec_without_returning(self.db_repo.conn())
            .await?;

        Ok(try_insert_result_to_int(result))
    }

    pub async fn get_or_create_user(&self, auth_id: &str) -> ServiceResult<db_user::Model> {
        let user = db_user::Entity::find()
            .filter(db_user::Column::AuthId.eq(auth_id))
            .one(self.db_repo.conn())
            .await?;

        if let Some(user) = user {
            return Ok(user);
        }

        let active_user = db_user::ActiveModel {
            auth_id: Set(auth_id.to_string()),
            name: Set(self.get_default_name(auth_id)),
            ..Default::default()
        };

        let user = db_user::Entity::insert(active_user)
            .exec_with_returning(self.db_repo.conn())
            .await?;

        Ok(user)
    }

    pub async fn get_user(&self, user_id: Uuid) -> ServiceResult<db_user::Model> {
        let user = db_user::Entity::find_by_id(user_id)
            .one(self.db_repo.conn())
            .await?;

        match user {
            None => Err(ServiceError::ResourceNotFound {
                resource: ("user".to_string()),
                id: (user_id.to_string()),
            }),
            Some(user) => Ok(user),
        }
    }

    pub async fn get_participants_mapping(
        &self,
        event_id: Uuid,
    ) -> ServiceResult<HashMap<Uuid, db_user::Model>> {
        let participants = self.get_participants(event_id).await?;
        let mut user_mapping = HashMap::<Uuid, db_user::Model>::new();
        for participant in participants {
            user_mapping.insert(participant.id, participant);
        }
        Ok(user_mapping)
    }

    pub fn get_default_name(&self, auth_id: &str) -> String {
        auth_id.split('@').next().unwrap_or(auth_id).to_string()
    }

    pub async fn get_participants(&self, event_id: Uuid) -> ServiceResult<Vec<db_user::Model>> {
        let users = db_user::Entity::find().all(self.db_repo.conn()).await?;

        let mut participants = Vec::<db_user::Model>::new();
        for user in users {
            let roles = user
                .find_related(db_event_role_assignment::Entity)
                .filter(db_event_role_assignment::Column::EventId.eq(event_id))
                .all(self.db_repo.conn())
                .await;
            match roles {
                Err(err) => (),
                Ok(roles) => {
                    if roles
                        .into_iter()
                        .any(|role| role.role == EventRole::Participant)
                    {
                        participants.push(user);
                    }
                }
            }
        }
        dbg!(participants.clone());
        Ok(participants)
    }

    /// Retrieves a mapping of participants to their respective teams for a given event.
    ///
    /// # Arguments
    ///
    /// * `event_id` - The unique identifier of the event.
    ///
    /// # Returns
    ///
    /// A `ServiceResult` containing a `HashMap` where the keys are participant `Uuid`s and the values are `db_team::Model` instances representing the teams.
    ///
    /// # Errors
    ///
    /// Returns a `ServiceError` if there is an issue retrieving participants or their associated teams from the database.
    /// ```
    pub async fn get_team_mapping(
        &self,
        event_id: Uuid,
    ) -> ServiceResult<HashMap<Uuid, db_team::Model>> {
        let participants = self.get_participants(event_id).await?;
        let mut team_mapping = HashMap::<Uuid, db_team::Model>::new();
        for participant in participants {
            let group = participant
                .find_related(db_team_role_assignment::Entity)
                .find_also_related(db_team::Entity)
                .one(self.db_repo.conn())
                .await?;
            match group {
                Some((_, Some(team))) => {
                    team_mapping.insert(participant.id, team);
                }
                _ => (),
            }
        }
        Ok(team_mapping)
    }
}
