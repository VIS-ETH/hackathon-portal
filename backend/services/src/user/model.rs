use chrono::NaiveDateTime;
use repositories::db::prelude::{db_event, EventPhase};
use repositories::db::sea_orm_active_enums::EventVisibility;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct CreateEventRequest {
    pub name: String,
    pub start: NaiveDateTime,
    pub end: NaiveDateTime,
    pub max_team_size: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct CreateEventResponse {
    pub id: Uuid,
}

impl From<db_event::Model> for CreateEventResponse {
    fn from(event: db_event::Model) -> Self {
        Self { id: event.id }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct GetEventRequest {
    pub id: Uuid,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct GetEventResponse {
    pub id: Uuid,
    pub name: String,
    pub start: NaiveDateTime,
    pub end: NaiveDateTime,
    pub max_team_size: u32,
    pub is_feedback_visible: bool,
    pub visibility: EventVisibility,
    pub phase: EventPhase,
}

impl From<db_event::Model> for GetEventResponse {
    fn from(event: db_event::Model) -> Self {
        Self {
            id: event.id,
            name: event.name,
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
pub struct ListEventsResponse {
    pub events: Vec<GetEventResponse>,
}
