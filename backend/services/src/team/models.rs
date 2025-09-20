use hackathon_portal_repositories::db::prelude::*;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Team {
    pub id: Uuid,
    pub event_id: Uuid,
    pub project_id: Option<Uuid>,
    pub name: String,
    pub slug: String,
    pub index: i32,
    pub photo_url: Option<String>,
}

impl From<db_team::Model> for Team {
    fn from(value: db_team::Model) -> Self {
        Self {
            id: value.id,
            event_id: value.event_id,
            project_id: value.project_id,
            name: value.name,
            slug: value.slug,
            index: value.index,
            photo_url: value.photo_id.map(String::from),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamInternal {
    pub id: Uuid,
    pub event_id: Uuid,
    pub project_id: Option<Uuid>,
    pub name: String,
    pub slug: String,
    pub index: i32,
    pub comment: Option<String>,
    pub extra_score: Option<f64>,
}

impl From<db_team::Model> for TeamInternal {
    fn from(value: db_team::Model) -> Self {
        Self {
            id: value.id,
            event_id: value.event_id,
            project_id: value.project_id,
            name: value.name,
            slug: value.slug,
            index: value.index,
            comment: value.comment,
            extra_score: value.extra_score,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamForCreate {
    pub event_id: Uuid,
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamForUpdate {
    pub name: Option<String>,
    pub photo_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamForUpdateInternal {
    pub comment: Option<String>,
    pub extra_score: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamCredentials {
    pub vm_password: Option<String>,
    pub ai_api_key: Option<String>,
}
