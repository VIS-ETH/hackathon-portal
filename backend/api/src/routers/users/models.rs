use crate::{ApiError, ApiResult};
use hackathon_portal_repositories::db::{EventRole, TeamRole};
use serde::{Deserialize, Serialize};
use utoipa::IntoParams;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct EventRoleOptQuery {
    /// Filter by event role
    pub role: Option<EventRole>,
}

#[derive(Serialize, Deserialize, Debug, Clone, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct TeamRoleOptQuery {
    /// Filter by team role
    pub role: Option<TeamRole>,
}

#[derive(Serialize, Deserialize, Debug, Clone, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct PoliciesQuery {
    /// Get the policies for this event
    pub event_id: Option<Uuid>,
    /// Get the policies for this team
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
