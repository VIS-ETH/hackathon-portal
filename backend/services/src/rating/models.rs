use hackathon_portal_repositories::db::prelude::{db_expert_rating, ExpertRatingCategory};
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
