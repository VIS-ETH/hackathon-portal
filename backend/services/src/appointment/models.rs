use chrono::NaiveDateTime;
use hackathon_portal_repositories::db::prelude::db_appointment;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Appointment {
    pub id: Uuid,
    pub event_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub content: Option<String>,
    pub start: NaiveDateTime,
    pub end: Option<NaiveDateTime>,
}

impl From<db_appointment::Model> for Appointment {
    fn from(value: db_appointment::Model) -> Self {
        Self {
            id: value.id,
            event_id: value.event_id,
            title: value.title,
            description: value.description,
            content: value.content,
            start: value.start,
            end: value.end,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct AppointmentForCreate {
    pub event_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub content: Option<String>,
    pub start: NaiveDateTime,
    pub end: Option<NaiveDateTime>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct AppointmentForUpdate {
    pub title: Option<String>,
    pub description: Option<String>,
    pub content: Option<String>,
    pub start: Option<NaiveDateTime>,
    pub end: Option<NaiveDateTime>,
}
