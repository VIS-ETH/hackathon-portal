use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamIdQuery {
    pub team_id: Uuid,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct ProjectIdDTO {
    pub project_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct PasswordDTO {
    pub password: Option<String>,
}
