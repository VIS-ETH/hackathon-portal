use axum::http::header::InvalidHeaderValue;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use derive_more::From;
use repositories::RepositoryError;
use serde::Serialize;
use serde_with::{serde_as, DisplayFromStr, TryFromInto};
use services::ServiceError;
use std::fmt;
use std::sync::Arc;
use utoipa::ToSchema;

pub type ApiResult<T> = Result<T, ApiError>;

#[serde_as]
#[derive(Debug, Serialize, From)]
pub enum ApiError {
    UrlNotFound {
        url: String,
    },

    Forbidden {
        resource: String,
        id: String,
        action: String,
    },

    NoAuthIdInRequest,
    NoCtxInRequest,

    // region: external library errors
    #[from]
    Service(ServiceError),

    #[from]
    Repositories(RepositoryError),

    // endregion

    // region: external library errors
    #[from]
    Config(#[serde_as(as = "DisplayFromStr")] config::ConfigError),

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
    // endregion
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
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
        write!(f, "{:?}", self)
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
        PublicError::from(&value)
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
                (StatusCode::NOT_FOUND, format!("Url '{}' not found", url))
            }
            ApiError::Forbidden {
                resource,
                id,
                action,
            } => (
                StatusCode::FORBIDDEN,
                format!(
                    "You do not have permission to {} {} '{}'",
                    action, resource, id
                ),
            ),
            ApiError::NoAuthIdInRequest | ApiError::NoCtxInRequest => (
                StatusCode::UNAUTHORIZED,
                "You must be authenticated to access this resource".to_string(),
            ),
            ApiError::Service(e) => match e {
                ServiceError::RegularUserRequired | ServiceError::ServiceUserRequired => (
                    StatusCode::FORBIDDEN,
                    "You do not have permission to access this resource".to_string(),
                ),
                ServiceError::NameNotUnique { name } => (
                    StatusCode::CONFLICT,
                    format!("Name '{}' is not unique", name),
                ),
                ServiceError::SlugNotUnique { slug } => (
                    StatusCode::CONFLICT,
                    format!("Slug '{}' is not unique", slug),
                ),
                ServiceError::ResourceNotFound { resource, id } => (
                    StatusCode::NOT_FOUND,
                    format!("{} '{}' not found", resource, id),
                ),
                ServiceError::Forbidden {
                    resource,
                    id,
                    action,
                } => (
                    StatusCode::FORBIDDEN,
                    format!(
                        "You do not have permission to {} {} '{}'",
                        action, resource, id
                    ),
                ),
                ServiceError::SidequestCooldown { allowed_at } => (
                    StatusCode::FORBIDDEN,
                    format!("You must wait until {}", allowed_at),
                ),
                ServiceError::EventPhase { current_phase } => (
                    StatusCode::FORBIDDEN,
                    format!("This action is not allowed in the phase {}", current_phase),
                ),
                ServiceError::SeaORM(_) => ise.clone(),
            },
            ApiError::Repositories(_)
            | ApiError::Config(_)
            | ApiError::Io(_)
            | ApiError::InvalidHeaderValue(_)
            | ApiError::TracingSetGlobalDefault(_)
            | ApiError::TracingFilterParse(_) => ise.clone(),
        };

        Self::new(status, message)
    }
}
