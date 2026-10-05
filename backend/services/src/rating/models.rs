use hackathon_portal_repositories::db::{
    db_jury_rating, db_technical_question, db_vote, JuryRatingCategory,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct JuryRating {
    pub id: Uuid,
    pub user_id: Uuid,
    pub team_id: Uuid,
    pub category: JuryRatingCategory,
    pub rating: f64,
}

impl From<db_jury_rating::Model> for JuryRating {
    fn from(value: db_jury_rating::Model) -> Self {
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
pub struct JuryRatingForCreate {
    pub team_id: Uuid,
    pub category: JuryRatingCategory,
    pub rating: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct JuryRatingForUpdate {
    pub rating: Option<f64>,
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
    pub score: Option<f64>,
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
    pub place: i32,
}

impl From<db_vote::Model> for PublicVote {
    fn from(value: db_vote::Model) -> Self {
        Self {
            team_id: value.team_id,
            user_id: value.user_id,
            place: value.place,
        }
    }
}
