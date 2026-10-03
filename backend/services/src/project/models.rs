use crate::user::models::{ReducedUser, User};
use hackathon_portal_repositories::db::{db_project, db_user};
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
    pub stakeholders: Vec<ReducedUser>,
}

impl From<(db_project::Model, Vec<db_user::Model>)> for Project {
    fn from((project, stakeholders): (db_project::Model, Vec<db_user::Model>)) -> Self {
        Self {
            id: project.id,
            event_id: project.event_id,
            name: project.name,
            slug: project.slug,
            content: project.content,
            stakeholders: stakeholders
                .into_iter()
                .map(User::from)
                .map(ReducedUser::from)
                .collect(),
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
    pub stakeholder_ids: Option<Vec<Uuid>>,
}
