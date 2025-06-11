use chrono::NaiveDateTime;
use hackathon_portal_repositories::db::prelude::*;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Sidequest {
    pub id: Uuid,
    pub event_id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: String,
    pub is_higher_result_better: bool,
}

impl From<db_sidequest::Model> for Sidequest {
    fn from(value: db_sidequest::Model) -> Self {
        Self {
            id: value.id,
            event_id: value.event_id,
            name: value.name,
            slug: value.slug,
            description: value.description,
            is_higher_result_better: value.is_higher_result_better,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SidequestForCreate {
    pub event_id: Uuid,
    pub name: String,
    pub description: String,
    pub is_higher_result_better: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SidequestForUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub is_higher_result_better: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Attempt {
    pub id: Uuid,
    pub sidequest_id: Uuid,
    pub user_id: Uuid,
    pub result: f64,
    pub attempted_at: NaiveDateTime,
}

impl From<db_sidequest_attempt::Model> for Attempt {
    fn from(value: db_sidequest_attempt::Model) -> Self {
        Self {
            id: value.id,
            sidequest_id: value.sidequest_id,
            user_id: value.user_id,
            result: value.result,
            attempted_at: value.attempted_at,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct AttemptForCreate {
    pub sidequest_id: Uuid,
    pub user_id: Uuid,
    pub result: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct AttemptForUpdate {
    pub result: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Cooldown {
    pub duration: u32,
    pub last_attempt: Option<NaiveDateTime>,
    pub next_attempt: Option<NaiveDateTime>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamLeaderboardEntry {
    pub team_id: Uuid,
    pub team_name: String,
    pub score: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct UserLeaderboardEntry {
    pub user_id: Uuid,
    pub user_name: String,
    pub score: u64,
    pub result: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct HistoryEntry {
    pub date: NaiveDateTime,
    pub score: f64,
}
