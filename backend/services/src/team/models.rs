use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct Team {
    pub id: Uuid,
    pub event_id: Uuid,
    pub project_id: Option<Uuid>,
    pub name: String,
    pub slug: String,
    pub index: i32,
    pub photo_id: Option<Uuid>,
    pub photo_url: Option<String>,
    pub password: Option<String>,
    pub ai_api_key: Option<String>,
    pub extra_score: Option<f64>,
    pub comment: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamForCreate {
    pub event_id: Uuid,
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamForUpdate {
    pub name: Option<String>,
    pub project_id: Option<Uuid>,
    pub photo_id: Option<Uuid>,
    pub password: Option<String>,
    pub ai_api_key: Option<String>,
    pub comment: Option<String>,
    pub extra_score: Option<f64>,
}
