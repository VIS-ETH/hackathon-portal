use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SidequestForCreate {
    pub event_id: Uuid,
    pub name: String,
    pub description: String,
    pub is_higher_result_better: bool,
}




