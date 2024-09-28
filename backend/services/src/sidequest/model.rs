use std::collections::HashMap;

use chrono::NaiveDateTime;
use sea_orm::FromQueryResult;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub enum LoopStatus {
    NonExisting,
    Running,
    Exited,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SidequestForCreate {
    pub event_id: Uuid,
    pub name: String,
    pub description: String,
    pub is_higher_result_better: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SidequestForPatch {
    pub event_id: Uuid,
    pub name: Option<String>,
    pub description: Option<String>,
    pub is_higher_result_better: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct AttemptForCreate {
    pub user_id: Uuid,
    pub result: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema, FromQueryResult)]
pub struct SidequestEntryForLeaderboard {
    pub user_id: Uuid,
    pub result: f64,
    pub points: Option<i64>,
}

pub struct TeamEntryForLeaderboard {
    pub group_id: Uuid,
    pub result: f64,
    pub rank: Option<i64>,
}
#[derive(Serialize, Deserialize, Debug, Clone, ToSchema, FromQueryResult)]
pub struct FullInfoTeamEntryForLeaderboard {
    pub group_name: String,
    pub group_id: Uuid,
    pub result: f64,
    pub rank: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema, FromQueryResult)]
pub struct FullInfoSidequestEntryForLeaderboard {
    pub user_name: String,
    pub user_id: Uuid,
    pub group_name: String,
    pub group_id: Uuid,
    pub result: f64,
    pub points: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct AggregatorStatus {
    pub event_id: Uuid,
    pub status: LoopStatus,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TimelineData {
    pub event_id: Uuid,
    pub start: Option<chrono::NaiveDateTime>,
    pub end: Option<chrono::NaiveDateTime>,
    pub scores: HashMap<String, Vec<(chrono::NaiveDateTime, i64)>>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema, FromQueryResult)]
pub struct TeamLatestResult {
    pub team_id: Uuid,
    pub valid_at_max: Option<NaiveDateTime>,
}
