use repositories::db::prelude::{EventRole, TeamRole};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventRoleOptQuery {
    pub role: Option<EventRole>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamRoleOptQuery {
    pub role: Option<TeamRole>,
}
