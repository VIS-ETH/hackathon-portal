use sea_orm::prelude::DateTime;

use crate::entity::sea_orm_active_enums::EventPhase;




pub struct CreateEvent {
    pub name: String,
    pub start: DateTime,
    pub end: DateTime,
    pub max_team_size: i32,
    pub kdf_secret: String,
    pub is_feedback_visible: bool,
    pub is_hidden: bool,
    pub phase: EventPhase,
}