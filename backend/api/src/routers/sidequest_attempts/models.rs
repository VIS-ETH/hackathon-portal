use crate::{ApiError, ApiResult};
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use utoipa::IntoParams;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct SidequestAttemptsQuery {
    /// Filter by event id
    pub event_id: Uuid,
    /// Filter by sidequest id
    pub sidequest_id: Option<Uuid>,
    /// Filter by team id
    pub team_id: Option<Uuid>,
    /// Filter by user id
    pub user_id: Option<Uuid>,
    /// Only attempts after this time
    pub after: Option<NaiveDateTime>,
    /// Only attempts before this time
    pub before: Option<NaiveDateTime>,
}

impl SidequestAttemptsQuery {
    pub fn validate(&self) -> ApiResult<()> {
        let n_values = [self.sidequest_id, self.team_id, self.user_id]
            .iter()
            .filter(|v| v.is_some())
            .count();

        if n_values > 1 {
            return Err(ApiError::BadRequest {
                reason: "At most one of sidequest_id, team_id, or user_id may be specified"
                    .to_string(),
            });
        }

        Ok(())
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct SidequestAttemptsCooldownQuery {
    /// Filter by event id
    pub event_id: Uuid,
    /// Filter by user id. Defaults to the current user.
    pub user_id: Option<Uuid>,
}
