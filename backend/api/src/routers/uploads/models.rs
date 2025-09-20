use hackathon_portal_repositories::db::prelude::MediaUsage;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct CreateUploadDTO {
    pub event_id: Uuid,
    pub usage: MediaUsage,
    pub content_length: i64,
    pub content_type: String,
}
