use axum::http::header::InvalidHeaderValue;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use chrono::TimeZone;
use chrono_tz::Europe::Zurich;
use derive_more::From;
use hackathon_portal_repositories::RepositoryError;
use hackathon_portal_services::ServiceError;
use serde::Serialize;
use serde_with::{serde_as, DisplayFromStr, TryFromInto};
use std::fmt;
use std::sync::Arc;
use utoipa::ToSchema;

pub type ApiResult<T> = Result<T, ApiError>;
pub type ApiJson<T> = ApiResult<Json<T>>;
pub type ApiJsonVec<T> = ApiResult<Json<Vec<T>>>;

#[serde_as]
#[derive(Debug, Serialize, From)]
pub enum ApiError {
    UrlNotFound {
        url: String,
    },

    BadRequest {
        reason: String,
    },

    Forbidden {
        action: String,
    },

    NoAuthIdInRequest,
    NoCtxInRequest,

    // region: internal library errors
    #[from]
    Service(ServiceError),

    #[from]
    Repository(RepositoryError),
    // endregion

    // region: external library errors
    #[from]
    Config(#[serde_as(as = "DisplayFromStr")] config::ConfigError),

    #[from]
    Dotenvy(#[serde_as(as = "DisplayFromStr")] dotenvy::Error),

    #[from]
    Io(#[serde_as(as = "DisplayFromStr")] std::io::Error),

    #[from]
    InvalidHeaderValue(#[serde_as(as = "DisplayFromStr")] InvalidHeaderValue),

    #[from]
    TracingSetGlobalDefault(
        #[serde_as(as = "DisplayFromStr")] tracing::subscriber::SetGlobalDefaultError,
    ),

    #[from]
    TracingFilterParse(#[serde_as(as = "DisplayFromStr")] tracing_subscriber::filter::ParseError),

    #[from]
    JobScheduler(#[serde_as(as = "DisplayFromStr")] tokio_cron_scheduler::JobSchedulerError),
    // endregion
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{self:?}")
    }
}

impl std::error::Error for ApiError {}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let mut response = PublicError::from(&self).into_response();
        response.extensions_mut().insert(Arc::new(self));
        response
    }
}

#[serde_as]
#[derive(Debug, Serialize, ToSchema)]
pub struct PublicError {
    #[serde_as(as = "TryFromInto<u16>")]
    #[schema(value_type = u16)]
    pub status: StatusCode,
    pub message: String,
}

impl PublicError {
    pub fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
        }
    }
}

impl fmt::Display for PublicError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{self:?}")
    }
}

impl std::error::Error for PublicError {}

impl IntoResponse for PublicError {
    fn into_response(self) -> Response {
        let Ok(body) = serde_json::to_value(&self) else {
            // This should never happen.
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        };

        (self.status, Json(body)).into_response()
    }
}

impl From<ApiError> for PublicError {
    fn from(value: ApiError) -> Self {
        Self::from(&value)
    }
}

impl From<&RepositoryError> for PublicError {
    fn from(value: &RepositoryError) -> Self {
        let ise = (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        );

        let (status, message) = match value {
            RepositoryError::ResourceNotFound { resource, id } => (
                StatusCode::NOT_FOUND,
                format!("{resource} '{id}' not found"),
            ),
            RepositoryError::SlugNotUnique { slug } => {
                (StatusCode::CONFLICT, format!("Slug '{slug}' is not unique"))
            }
            RepositoryError::SeaORM(_)
            | RepositoryError::S3HeadObject(_)
            | RepositoryError::S3GetObject(_)
            | RepositoryError::S3PutObject(_)
            | RepositoryError::S3PresigningConfig(_) => ise,
        };

        Self::new(status, message)
    }
}

impl From<&ServiceError> for PublicError {
    fn from(value: &ServiceError) -> Self {
        let ise = (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        );

        let (status, message) = match value {
            ServiceError::ResourceStillInUse { resource, id } => (
                StatusCode::CONFLICT,
                format!("{resource} '{id}' is still in use"),
            ),
            ServiceError::UserIsAlreadyMemberOfAnotherTeam { name } => (
                StatusCode::BAD_REQUEST,
                format!("User '{name}' is already a member of another team"),
            ),
            ServiceError::TeamSizeExceeded { expected, actual } => (
                StatusCode::BAD_REQUEST,
                format!("Team size is {actual} which exceeds the limit of {expected}"),
            ),
            ServiceError::CannotUnassignAllAdmins { resource, id } => (
                StatusCode::BAD_REQUEST,
                format!("Cannot unassign all admins from {resource} '{id}'"),
            ),
            ServiceError::Forbidden {
                resource,
                id,
                action,
            } => (
                StatusCode::FORBIDDEN,
                format!("You do not have permission to {action} {resource} '{id}'"),
            ),
            ServiceError::ProjectPreferenceDuplicate => (
                StatusCode::BAD_REQUEST,
                "Project preferences must be unique".to_string(),
            ),
            ServiceError::ProjectPreferenceWrongCount { expected, actual } => (
                StatusCode::BAD_REQUEST,
                format!("Wrong number of project preferences, expected {expected}, got {actual}"),
            ),
            ServiceError::SidequestCooldown { expires_at } => {
                let expires_at_local = Zurich.from_utc_datetime(expires_at);
                let expires_at_str = expires_at_local.format("%H:%M");

                (
                    StatusCode::FORBIDDEN,
                    format!("Wait until {expires_at_str} before attempting another sidequest"),
                )
            }
            ServiceError::EventPhase { current_phase } => (
                StatusCode::FORBIDDEN,
                format!("This action is not allowed in the phase {current_phase}"),
            ),
            ServiceError::UploadsMimeNotAllowed => (
                StatusCode::BAD_REQUEST,
                "You may not upload files of this type".to_string(),
            ),
            ServiceError::UploadsSizeLimitExceeded { size, limit } => {
                let size = (*size as f64) / 2f64.powf(20f64);
                let limit = (*limit as f64) / 2f64.powf(20f64);

                (
                    StatusCode::BAD_REQUEST,
                    format!(
                        "File ({size:.1} MB) exceeds the size limit of {limit:.1} MB"
                    ),
                )
            },
            ServiceError::UploadsRateLimitExceeded => (
                StatusCode::FORBIDDEN,
                "You have uploaded too many files in a short period of time. Please wait and try again later.".to_string()
            ),
            ServiceError::Repository(e) => return e.into(),
            ServiceError::Matching { message } => (StatusCode::BAD_REQUEST, message.clone()),
            ServiceError::SeaORM(_) => ise,
        };

        Self::new(status, message)
    }
}

impl From<&ApiError> for PublicError {
    fn from(value: &ApiError) -> Self {
        let ise = (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        );

        let (status, message) = match value {
            ApiError::UrlNotFound { url } => {
                (StatusCode::NOT_FOUND, format!("Url '{url}' not found"))
            }
            ApiError::BadRequest { reason } => (StatusCode::BAD_REQUEST, reason.clone()),
            ApiError::Forbidden { action } => (
                StatusCode::FORBIDDEN,
                format!("You do not have the permissions to {action}"),
            ),
            ApiError::NoAuthIdInRequest | ApiError::NoCtxInRequest => (
                StatusCode::UNAUTHORIZED,
                "You must be authenticated to access this resource".to_string(),
            ),
            ApiError::Service(e) => return e.into(),
            ApiError::Repository(e) => return e.into(),
            ApiError::Config(_)
            | ApiError::Dotenvy(_)
            | ApiError::Io(_)
            | ApiError::InvalidHeaderValue(_)
            | ApiError::TracingSetGlobalDefault(_)
            | ApiError::TracingFilterParse(_)
            | ApiError::JobScheduler(_) => ise,
        };

        Self::new(status, message)
    }
}
