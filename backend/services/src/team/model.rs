use repositories::db::prelude::*;
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
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct ProjectPreferences {
    pub project_preferences: Vec<Uuid>,
}
