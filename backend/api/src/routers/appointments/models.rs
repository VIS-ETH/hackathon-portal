use chrono::NaiveDateTime;
use repositories::db::prelude::db_appointment;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct AppointmentDTO {
    pub id: Uuid,
    pub event_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub content: Option<String>,
    pub start: NaiveDateTime,
    pub end: Option<NaiveDateTime>,
}

impl From<db_appointment::Model> for AppointmentDTO {
    fn from(event: db_appointment::Model) -> Self {
        Self {
            id: event.id,
            event_id: event.event_id,
            title: event.title,
            description: event.description,
            content: event.content,
            start: event.start,
            end: event.end,
        }
    }
}
