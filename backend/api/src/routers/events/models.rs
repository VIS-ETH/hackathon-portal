use chrono::NaiveDateTime;
use hackathon_portal_repositories::db::prelude::EventRole;
use hackathon_portal_services::user::models::UserForCreate;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct InviteUsersDTO {
    pub users: Vec<UserForCreate>,
    pub roles: HashSet<EventRole>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventIdQuery {
    pub event_id: Uuid,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SidequestsHistoryQuery {
    pub after: Option<NaiveDateTime>,
    pub before: Option<NaiveDateTime>,
}
