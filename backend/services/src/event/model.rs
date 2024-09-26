use chrono::NaiveDateTime;
use repositories::db::prelude::*;
use repositories::db::sea_orm_active_enums::EventVisibility;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventForCreate {
    pub name: String,
    pub start: NaiveDateTime,
    pub end: NaiveDateTime,
    pub max_team_size: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventResponse {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub start: NaiveDateTime,
    pub end: NaiveDateTime,
    pub max_team_size: u32,
    pub is_feedback_visible: bool,
    pub visibility: EventVisibility,
    pub phase: EventPhase,
}

impl From<db_event::Model> for EventResponse {
    fn from(event: db_event::Model) -> Self {
        Self {
            id: event.id,
            name: event.name,
            slug: event.slug,
            start: event.start,
            end: event.end,
            max_team_size: event.max_team_size as u32,
            is_feedback_visible: event.is_feedback_visible,
            visibility: event.visibility,
            phase: event.phase,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventForPatch {
    pub name: Option<String>,
    pub start: Option<NaiveDateTime>,
    pub end: Option<NaiveDateTime>,
    pub max_team_size: Option<u32>,
    pub is_feedback_visible: Option<bool>,
    pub visibility: Option<EventVisibility>,
    pub phase: Option<EventPhase>,
}
