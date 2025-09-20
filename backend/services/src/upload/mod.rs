pub mod models;

use crate::upload::models::UploadUrl;
use crate::{ServiceError, ServiceResult};
use aws_smithy_types_convert::date_time::DateTimeExt;
use chrono::Utc;
use hackathon_portal_repositories::db::prelude::*;
use hackathon_portal_repositories::s3::S3Repository;
use hackathon_portal_repositories::DbRepository;
use mime::Mime;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, Set};
use std::time::Duration;

#[derive(Clone)]
pub struct UploadService {
    db_repo: DbRepository,
    s3_repo: S3Repository,
}

impl UploadService {
    const MB: i64 = 1 << 20;
    const UPLOADS_RATE_LIMIT_COUNT: u64 = 20;
    const UPLOADS_RATE_LIMIT_INTERVAL: Duration = Duration::from_secs(60 * 30); // 30 minutes
    const PRESIGNED_URL_EXPIRATION: Duration = Duration::from_secs(60 * 15); // 15 minutes

    #[must_use]
    pub const fn new(db_repo: DbRepository, s3_repo: S3Repository) -> Self {
        Self { db_repo, s3_repo }
    }

    fn validate_content_type(usage: MediaUsage, mime: &Mime) -> ServiceResult<()> {
        match (usage, (mime.type_(), mime.subtype())) {
            (MediaUsage::TeamPhoto, (mime::IMAGE, mime::JPEG | mime::PNG)) => Ok(()),
            _ => Err(ServiceError::UploadContentTypeNotAllowed),
        }
    }

    fn validate_content_length(usage: MediaUsage, size: i64) -> ServiceResult<()> {
        let limit_mb = match usage {
            MediaUsage::TeamPhoto => 10,
        };

        let limit = limit_mb * Self::MB;

        if size > limit {
            return Err(ServiceError::UploadContentLengthExceeded { size, limit });
        }

        Ok(())
    }

    async fn validate_rate_limit(&self, user_id: Uuid) -> ServiceResult<()> {
        let rate_limit_cutoff = Utc::now().naive_utc() - Self::UPLOADS_RATE_LIMIT_INTERVAL;

        let recent_uploads = db_upload::Entity::find()
            .filter(db_upload::Column::UserId.eq(user_id))
            .filter(db_upload::Column::RequestedAt.gt(rate_limit_cutoff))
            .count(self.db_repo.conn())
            .await?;

        if recent_uploads >= Self::UPLOADS_RATE_LIMIT_COUNT {
            Err(ServiceError::UploadRateLimitExceeded)
        } else {
            Ok(())
        }
    }

    pub async fn validate_upload_request(
        &self,
        user_id: Uuid,
        usage: MediaUsage,
        content_type: &Mime,
        content_size: i64,
    ) -> ServiceResult<()> {
        Self::validate_content_type(usage, content_type)?;
        Self::validate_content_length(usage, content_size)?;
        self.validate_rate_limit(user_id).await?;

        Ok(())
    }

    pub async fn create_upload(
        &self,
        user_id: Uuid,
        usage: MediaUsage,
        content_type: &Mime,
        content_size: i64,
    ) -> ServiceResult<UploadUrl> {
        let id = Uuid::new_v4();
        let url = self
            .s3_repo
            .presign_put_object(
                &id.to_string(),
                Some(content_type),
                Some(content_size),
                Self::PRESIGNED_URL_EXPIRATION,
            )
            .await?;

        let active_upload = db_upload::ActiveModel {
            id: Set(id),
            user_id: Set(user_id),
            usage: Set(usage),
            content_length: Set(content_size),
            content_type: Set(content_type.to_string()),
            requested_at: Set(Utc::now().naive_utc()),
            uploaded_at: Set(None),
            validated_at: Set(None),
        };

        active_upload.insert(self.db_repo.conn()).await?;

        let upload = UploadUrl { id, url };

        Ok(upload)
    }

    pub async fn validate_upload(
        &self,
        id: Uuid,
        usage: MediaUsage,
        allow_reuse: bool,
    ) -> ServiceResult<()> {
        // TODO: transaction

        let upload = self.db_repo.get_upload(id).await?;

        if upload.validated_at.is_some() && !allow_reuse {
            return Err(ServiceError::UploadIsAlreadyValidated);
        }

        if upload.usage != usage {
            return Err(ServiceError::UploadMediaUsageMismatch {
                expected: usage,
                actual: upload.usage,
            });
        }

        let head = self.s3_repo.head_object(&upload.id.to_string()).await?;

        let last_modified = head
            .last_modified
            .map(|dt| dt.to_chrono_utc().ok())
            .flatten()
            .map(|dt| dt.naive_utc());

        let mut active_upload = upload.into_active_model();
        active_upload.uploaded_at = Set(last_modified);
        active_upload.validated_at = Set(Some(Utc::now().naive_utc()));
        active_upload.save(self.db_repo.conn()).await?;

        Ok(())
    }

    pub async fn inject_url(&self, value: &mut String) -> ServiceResult<()> {
        let Some(id) = value.parse::<Uuid>().ok() else {
            return Ok(());
        };

        *value = self
            .s3_repo
            .presign_get_object(&id.to_string(), Self::PRESIGNED_URL_EXPIRATION)
            .await?;

        Ok(())
    }

    pub async fn inject_url_opt(&self, value: Option<&mut String>) -> ServiceResult<()> {
        if let Some(value) = value {
            self.inject_url(value).await?;
        }

        Ok(())
    }
}
