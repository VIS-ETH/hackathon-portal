use crate::{ApiError, ApiResult};
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SidequestAttemptsQuery {
    pub event_id: Uuid,
    pub sidequest_id: Option<Uuid>,
    pub team_id: Option<Uuid>,
    pub user_id: Option<Uuid>,
    pub after: Option<NaiveDateTime>,
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

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SidequestAttemptsCooldownQuery {
    pub event_id: Uuid,
    pub user_id: Option<Uuid>,
}
