use crate::{ApiError, ApiResult};
use repositories::db::prelude::{EventRole, TeamRole};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventRoleOptQuery {
    pub role: Option<EventRole>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamRoleOptQuery {
    pub role: Option<TeamRole>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct PoliciesQuery {
    pub event_id: Option<Uuid>,
    pub team_id: Option<Uuid>,
}

impl PoliciesQuery {
    pub fn validate(&self) -> ApiResult<()> {
        let n_values = [self.event_id, self.team_id]
            .iter()
            .filter(|v| v.is_some())
            .count();

        if n_values != 1 {
            return Err(ApiError::BadRequest {
                reason: "Exactly one of event_id or team_id must be specified".to_string(),
            });
        }

        Ok(())
    }
}
