pub mod models;

use crate::upload::models::UploadUrl;
use crate::{ServiceError, ServiceResult};
use chrono::Utc;
use hackathon_portal_repositories::db::prelude::*;
use hackathon_portal_repositories::s3::S3Repository;
use hackathon_portal_repositories::DbRepository;
use mime::Mime;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, Set};
use std::time::Duration;
use tracing::{error, info};

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
            _ => Err(ServiceError::UploadsMimeNotAllowed),
        }
    }

    fn validate_content_length(usage: MediaUsage, size: i64) -> ServiceResult<()> {
        let limit_mb = match usage {
            MediaUsage::TeamPhoto => 10,
        };

        let limit = limit_mb * Self::MB;

        if size > limit {
            return Err(ServiceError::UploadsSizeLimitExceeded { size, limit });
        }

        Ok(())
    }

    async fn validate_rate_limit(&self, user_id: Uuid) -> ServiceResult<()> {
        let rate_limit_cutoff = Utc::now().naive_utc() - Self::UPLOADS_RATE_LIMIT_INTERVAL;

        let recent_uploads = db_upload::Entity::find()
            .filter(db_upload::Column::UserId.eq(user_id))
            .filter(db_upload::Column::UploadedAfter.gt(rate_limit_cutoff))
            .count(self.db_repo.conn())
            .await?;

        if recent_uploads >= Self::UPLOADS_RATE_LIMIT_COUNT {
            Err(ServiceError::UploadsRateLimitExceeded)
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
            uploaded_after: Set(Utc::now().naive_utc()),
            uploaded_before: Set((Utc::now() + Self::PRESIGNED_URL_EXPIRATION).naive_utc()),
            validated_at: Set(None),
        };

        active_upload.insert(self.db_repo.conn()).await?;

        let upload = UploadUrl { id, url };

        Ok(upload)
    }

    pub async fn validate_upload(&self, upload: db_upload::Model) -> ServiceResult<()> {
        let now = Utc::now().naive_utc();

        let upload_exists = self.s3_repo.object_exists(&upload.id.to_string()).await?;
        let upload_expired = now > upload.uploaded_before;

        if upload_exists {
            info!(upload_id = %upload.id, "Upload validated successfully");
            let mut active_upload = upload.into_active_model();
            active_upload.validated_at = Set(Some(now));
            active_upload.update(self.db_repo.conn()).await?;
        } else if upload_expired {
            info!(upload_id = %upload.id, "Upload expired and will be deleted");
            db_upload::Entity::delete_by_id(upload.id)
                .exec(self.db_repo.conn())
                .await?;
        }

        Ok(())
    }

    pub async fn validate_uploads(&self) -> ServiceResult<()> {
        let uploads = self.db_repo.get_pending_uploads().await?;

        for upload in uploads {
            let id = upload.id;
            if let Err(e) = self.validate_upload(upload).await {
                error!(upload = %id, error = %e, "Error validating upload");
            }
        }

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
