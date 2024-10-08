use chrono::NaiveDateTime;
use repositories::db::prelude::*;
use repositories::db::sea_orm_active_enums::EventVisibility;
use sea_orm::prelude::DateTime;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Event {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub start: DateTime,
    pub end: DateTime,
    pub welcome_content: Option<String>,
    pub documentation_content: Option<String>,
    pub max_team_size: u32,
    pub sidequest_cooldown: u32,
    pub is_read_only: bool,
    pub is_feedback_visible: bool,
    pub visibility: EventVisibility,
    pub phase: EventPhase,
}

impl From<db_event::Model> for Event {
    fn from(value: db_event::Model) -> Self {
        Self {
            id: value.id,
            name: value.name,
            slug: value.slug,
            start: value.start,
            end: value.end,
            welcome_content: value.welcome_content,
            documentation_content: value.documentation_content,
            max_team_size: value.max_team_size as u32,
            sidequest_cooldown: value.sidequest_cooldown as u32,
            is_read_only: value.is_read_only,
            is_feedback_visible: value.is_feedback_visible,
            visibility: value.visibility,
            phase: value.phase,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventForCreate {
    pub name: String,
    pub start: NaiveDateTime,
    pub end: NaiveDateTime,
    pub max_team_size: u32,
    pub sidequest_cooldown: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventForUpdate {
    pub name: Option<String>,
    pub start: Option<NaiveDateTime>,
    pub end: Option<NaiveDateTime>,
    pub welcome_content: Option<String>,
    pub documentation_content: Option<String>,
    pub max_team_size: Option<u32>,
    pub sidequest_cooldown: Option<u32>,
    pub is_read_only: Option<bool>,
    pub is_feedback_visible: Option<bool>,
    pub visibility: Option<EventVisibility>,
    pub phase: Option<EventPhase>,
}
