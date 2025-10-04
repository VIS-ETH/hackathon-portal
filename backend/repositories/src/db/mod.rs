mod extensions;
pub mod generated; // needs to be public for Utoipa
mod repositories;

use crate::{RepositoryError, RepositoryResult};
use sea_orm::{Database, DbConn};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio::time::timeout;

// region: exports
pub use extensions::*;

pub use repositories::*;

pub use generated::appointment as db_appointment;
pub use generated::event as db_event;
pub use generated::event_role_assignment as db_event_role_assignment;
pub use generated::event_user_discord_id as db_event_user_discord_id;
pub use generated::expert_rating as db_expert_rating;
pub use generated::project as db_project;
pub use generated::project_preference as db_project_preference;
pub use generated::sidequest as db_sidequest;
pub use generated::sidequest_attempt as db_sidequest_attempt;
pub use generated::sidequest_score as db_sidequest_score;
pub use generated::team as db_team;
pub use generated::team_role_assignment as db_team_role_assignment;
pub use generated::upload as db_upload;
pub use generated::user as db_user;

pub use generated::sea_orm_active_enums::{
    EventPhase, EventRole, EventVisibility, ExpertRatingCategory, MediaUsage, TeamRole,
};
// endregion

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DbConfig {
    pub url: String,
}

#[derive(Clone)]
pub struct DbRepository {
    pub conn: DbConn,
}

impl DbRepository {
    #[must_use]
    pub const fn new(conn: DbConn) -> Self {
        Self { conn }
    }

    pub async fn from_config(config: &DbConfig) -> RepositoryResult<Self> {
        let result = Self {
            conn: Database::connect(config.url.clone()).await?,
        };

        Ok(result)
    }

    #[must_use]
    pub const fn conn(&self) -> &DbConn {
        &self.conn
    }

    pub async fn ping(&self, timeout_duration: Duration) -> RepositoryResult<()> {
        match timeout(timeout_duration, self.conn().ping()).await {
            Ok(inner) => inner.map_err(Into::into),
            Err(_) => Err(RepositoryError::Timeout {
                message: "Database ping timed out".to_string(),
            }),
        }
    }
}
