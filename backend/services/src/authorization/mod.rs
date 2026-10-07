mod event;
pub mod models;
mod team;

pub mod groups;
pub mod policies;

use crate::authorization::models::UserRoles;
use crate::ServiceResult;
use hackathon_portal_repositories::DbRepository;
use sea_orm::prelude::*;
use tokio::try_join;

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
        let (event_roles, team_roles) =
            try_join!(self.get_event_roles(user_id), self.get_team_roles(user_id))?;

        Ok(UserRoles::new(event_roles, team_roles))
    }
}
