use chrono::NaiveDateTime;
use repositories::db::prelude::db_sidequest;
use repositories::db::sea_orm_active_enums::EventVisibility;
use serde::{Deserialize, Serialize};
use services::user::model::UserForCreate;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SidequestDTO {
    pub id: Uuid,
    pub event_id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: String,
    pub is_higher_result_better: bool,
}

impl From<db_sidequest::Model> for SidequestDTO {
    fn from(quest: db_sidequest::Model) -> Self {
        Self {
            id: quest.id,
            event_id: quest.event_id,
            name: quest.name,
            slug: quest.slug,
            description: quest.description,
            is_higher_result_better: quest.is_higher_result_better,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct CreateSidequestDTO {
    pub event_id: Uuid,
    pub name: String,
    pub description: String,
    pub is_higher_result_better: bool,
}
