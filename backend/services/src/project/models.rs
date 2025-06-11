use hackathon_portal_repositories::db::prelude::db_project;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Project {
    pub id: Uuid,
    pub event_id: Uuid,
    pub name: String,
    pub slug: String,
    pub content: String,
}

impl From<db_project::Model> for Project {
    fn from(event: db_project::Model) -> Self {
        Self {
            id: event.id,
            event_id: event.event_id,
            name: event.name,
            slug: event.slug,
            content: event.content,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct ProjectForCreate {
    pub event_id: Uuid,
    pub name: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct ProjectForUpdate {
    pub name: Option<String>,
    pub content: Option<String>,
}
