use chrono::NaiveDateTime;
use hackathon_portal_repositories::db::prelude::{db_upload, MediaUsage};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Upload {
    pub id: Uuid,
    pub user_id: Uuid,
    pub usage: MediaUsage,
    pub content_length: i64,
    pub content_type: String,
    pub requested_at: NaiveDateTime,
    pub uploaded_at: Option<NaiveDateTime>,
    pub validated_at: Option<NaiveDateTime>,
}

impl From<db_upload::Model> for Upload {
    fn from(value: db_upload::Model) -> Self {
        Self {
            id: value.id,
            user_id: value.user_id,
            usage: value.usage,
            content_length: value.content_length,
            content_type: value.content_type,
            requested_at: value.requested_at,
            uploaded_at: value.uploaded_at,
            validated_at: value.validated_at,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct UploadUrl {
    pub id: Uuid,
    pub url: String,
}
