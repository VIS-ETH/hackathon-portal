use chrono::NaiveDateTime;
use repositories::db::prelude::*;
use repositories::db::sea_orm_active_enums::EventVisibility;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventForCreate {
    pub name: String,
    pub start: NaiveDateTime,
    pub end: NaiveDateTime,
    pub max_team_size: u32,
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
