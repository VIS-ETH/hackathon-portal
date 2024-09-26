pub mod model;

use crate::ctx::User;
use repositories::db::prelude::*;
use sea_orm::prelude::*;
use sea_orm::Set;
use std::collections::{HashMap, HashSet};

use crate::ServiceResult;
use repositories::DbRepository;

#[derive(Clone)]
pub struct UserService {
    db_repo: DbRepository,
}

impl UserService {
    pub fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn get_or_create_ctx_user(&self, auth_id: &str) -> ServiceResult<User> {
        let user = db_user::Entity::find()
            .filter(db_user::Column::AuthId.eq(auth_id))
            .one(self.db_repo.conn())
            .await?;

        let user = match user {
            Some(user) => user,
            None => {
                let name = auth_id.split('@').next().unwrap_or("Unknown");

                let active_user = db_user::ActiveModel {
                    auth_id: Set(auth_id.to_string()),
                    name: Set(name.to_string()),
                    ..Default::default()
                };

                let user = db_user::Entity::insert(active_user)
                    .exec_with_returning(self.db_repo.conn())
                    .await?;

                user
            }
        };

        let event_role_assignments = db_event_role_assignment::Entity::find()
            .filter(db_event_role_assignment::Column::UserId.eq(user.id))
            .all(self.db_repo.conn())
            .await?;

        let events_roles =
            event_role_assignments
                .into_iter()
                .fold(HashMap::new(), |mut acc, assignment| {
                    acc.entry(assignment.event_id)
                        .or_insert_with(HashSet::new)
                        .insert(assignment.role);

                    acc
                });

        let team_role_assignments = db_team_role_assignment::Entity::find()
            .filter(db_team_role_assignment::Column::UserId.eq(user.id))
            .all(self.db_repo.conn())
            .await?;

        let teams_roles =
            team_role_assignments
                .into_iter()
                .fold(HashMap::new(), |mut acc, assignment| {
                    acc.entry(assignment.team_id)
                        .or_insert_with(HashSet::new)
                        .insert(assignment.role);

                    acc
                });

        let user = User::Regular {
            user,
            events_roles,
            teams_roles,
        };

        Ok(user)
    }
}
