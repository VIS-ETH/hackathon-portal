use chrono::NaiveDateTime;
use hackathon_portal_repositories::db::EventRole;
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

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct DiscordOauthBody {
    pub code: String,
    pub redirect_uri: String,
}

// Define the response type
#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventDiscordResponse {
    pub discord_user_id: Option<String>, // or U64 depending on your DB schema
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct CreateTechnicalQuestionDTO {
    pub question: String,
    pub description: Option<String>,
    pub min_points: i32,
    pub max_points: i32,
    pub binary: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct UpdateTechnicalQuestionDTO {
    pub question: Option<String>,
    pub description: Option<String>,
    pub min_points: Option<i32>,
    pub max_points: Option<i32>,
    pub binary: Option<bool>,
}
