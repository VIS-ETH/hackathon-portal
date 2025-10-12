use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct FinalistStatus {
    pub team_id: Uuid,
    pub finalist: bool,
}
