use hackathon_portal_repositories::db::{
    db_expert_rating, db_technical_question, db_vote, ExpertRatingCategory,
};
use sea_orm::FromQueryResult;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct ExpertRating {
    pub id: Uuid,
    pub user_id: Uuid,
    pub team_id: Uuid,
    pub category: ExpertRatingCategory,
    pub rating: f64,
}

impl From<db_expert_rating::Model> for ExpertRating {
    fn from(value: db_expert_rating::Model) -> Self {
        Self {
            id: value.id,
            user_id: value.user_id,
            team_id: value.team_id,
            category: value.category,
            rating: value.rating,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct ExpertRatingForCreate {
    pub team_id: Uuid,
    pub category: ExpertRatingCategory,
    pub rating: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct ExpertRatingForUpdate {
    pub rating: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct ExpertRatingLeaderboardEntry {
    pub team_id: Uuid,
    pub rating: f64,
    pub categories: HashMap<ExpertRatingCategory, f64>,
}

#[derive(Debug, FromQueryResult)]
pub struct AggregatedRating {
    pub team_id: Uuid,
    pub category: ExpertRatingCategory,
    pub average: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TechnicalQuestion {
    pub id: Uuid,
    pub event_id: Uuid,
    pub question: String,
    pub description: Option<String>,
    pub min_points: i32,
    pub max_points: i32,
    pub binary: bool,
}

impl From<db_technical_question::Model> for TechnicalQuestion {
    fn from(value: db_technical_question::Model) -> Self {
        Self {
            id: value.id,
            event_id: value.event_id,
            question: value.question,
            description: value.description,
            min_points: value.min_points,
            max_points: value.max_points,
            binary: value.binary,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct CreateTechnicalQuestion {
    pub event_id: Uuid,
    pub question: String,
    pub description: Option<String>,
    pub min_points: i32,
    pub max_points: i32,
    pub binary: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct UpdateTechnicalQuestion {
    pub id: Uuid,
    pub question: Option<String>,
    pub description: Option<String>,
    pub min_points: Option<i32>,
    pub max_points: Option<i32>,
    pub binary: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TechnicalQuestionResult {
    pub question: TechnicalQuestion,
    pub points: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Vote {
    pub team_id: Uuid,
    pub place: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct PublicVote {
    pub team_id: Uuid,
    pub user_id: Uuid,
    pub rank: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct PublicVoteAggregated {
    pub team_id: Uuid,
    pub num_votes_per_rank: HashMap<i32, i32>,
}

impl From<db_vote::Model> for PublicVote {
    fn from(value: db_vote::Model) -> Self {
        Self {
            team_id: value.team_id,
            user_id: value.user_id,
            rank: value.rank,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TechnicalScore {
    pub score_normalized: f64,
    pub score: f64,
    pub category_rank: i32,
    pub all_answered: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct ExpertScore {
    pub score_normalized: f64,
    pub score: f64,
    pub presentation_score: f64,
    pub product_score: f64,
    pub category_rank: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SidequestScore {
    pub score_normalized: f64,
    pub score: f64,
    pub category_rank: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct VotingScore {
    pub score_normalized: f64,
    pub category_rank: i32,
    pub score: f64,
    pub votes: HashMap<i32, i32>, // rank -> number of votes
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct ScoreNormalized {
    pub team_id: Uuid,
    pub tech_score: Option<TechnicalScore>,
    pub expert_score: Option<ExpertScore>,
    pub sidequest_score: Option<SidequestScore>,
    pub voting_score: Option<VotingScore>,
    pub extra_score: f64,
    pub final_score: f64,
    pub max_final_score: Option<f64>,
    pub rank: Option<i32>,
}
