use chrono::NaiveDateTime;
use repositories::db::prelude::{db_event, EventPhase, EventRole};
use repositories::db::sea_orm_active_enums::EventVisibility;
use serde::{Deserialize, Serialize};
use services::user::model::UserForCreate;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub enum AggregationAction {
    Start,
    Stop,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventDTO {
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

impl From<db_event::Model> for EventDTO {
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
pub struct InviteUsersDTO {
    pub users: Vec<UserForCreate>,
    pub default_roles: Vec<EventRole>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventIdQuery {
    pub event_id: Uuid,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct AggregateActionQuery {
    pub aggregate_action: AggregationAction,
}
