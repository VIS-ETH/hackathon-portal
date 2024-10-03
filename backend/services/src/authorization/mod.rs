mod event;
pub mod models;
mod team;

pub mod groups;
mod policies;

use crate::authorization::models::UserRoles;
use crate::ServiceResult;
use repositories::DbRepository;
use sea_orm::prelude::*;

#[derive(Clone)]
pub struct AuthorizationService {
    db_repo: DbRepository,
}

impl AuthorizationService {
    #[must_use]
    pub const fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn get_roles(&self, user_id: Uuid) -> ServiceResult<UserRoles> {
        let roles = UserRoles::new(
            self.get_event_roles(user_id).await?,
            self.get_team_roles(user_id).await?,
        );

        Ok(roles)
    }
}
