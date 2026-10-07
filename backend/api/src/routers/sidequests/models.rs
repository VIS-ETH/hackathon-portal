use serde::{Deserialize, Serialize};
use utoipa::IntoParams;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct SidequestIdQuery {
    /// Filter by sidequest id
    pub sidequest_id: Uuid,
}
