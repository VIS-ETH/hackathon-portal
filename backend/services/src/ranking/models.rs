use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use utoipa::ToSchema;
use uuid::Uuid;

/// Teams are sorted by `rank`.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, ToSchema)]
pub struct Ranking {
    pub max_total_points: f64,
    pub teams: Vec<TeamRanking>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, ToSchema)]
pub struct TeamRanking {
    pub team_id: Uuid,
    pub team_name: String,
    pub team_index: i32,
    pub finalist: bool,
    pub rank: i32,
    pub total_points: f64,
    pub extra_points: f64,
    pub technical: TechnicalScore,
    pub jury: JuryScore,
    pub sidequest: SidequestScore,
    pub public: PublicScore,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, ToSchema)]
pub struct TechnicalScore {
    pub score: f64,
    pub points: f64,
    pub rank: i32,
    pub all_answered: bool,
    /// One per technical question of the event, ordered by question id. Snapshots created
    /// before this field existed read back with an empty list.
    #[serde(default)]
    pub answers: Vec<TechnicalAnswer>,
}

/// A technical question as it was when the ranking was computed, with the team's rating.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, ToSchema)]
pub struct TechnicalAnswer {
    pub question_id: Uuid,
    pub question: String,
    pub description: Option<String>,
    pub min_points: i32,
    pub max_points: i32,
    pub binary: bool,
    /// `None` if the question has not been rated for the team
    pub score: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, ToSchema)]
pub struct JuryScore {
    pub score: f64,
    pub points: f64,
    pub rank: i32,
    pub presentation_score: f64,
    pub product_score: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, ToSchema)]
pub struct SidequestScore {
    pub score: f64,
    pub points: f64,
    pub rank: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, ToSchema)]
pub struct PublicScore {
    pub score: f64,
    pub points: f64,
    pub rank: i32,
    pub votes: BTreeMap<i32, i32>, // place -> number of votes
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, ToSchema)]
pub struct RankingSnapshotInfo {
    pub id: Uuid,
    pub created_at: NaiveDateTime,
    pub is_current: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, ToSchema)]
pub struct RankingSnapshot {
    pub id: Uuid,
    pub created_at: NaiveDateTime,
    pub is_current: bool,
    pub ranking: Ranking,
}
