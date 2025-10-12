use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SetTechnicalRating {
    pub question_id: Uuid,
    pub score: f64,
}
