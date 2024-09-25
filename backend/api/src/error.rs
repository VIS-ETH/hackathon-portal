use axum::http::header::InvalidHeaderValue;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use derive_more::From;
use serde::Serialize;
use serde_with::{serde_as, DisplayFromStr, TryFromInto};
use std::fmt;
use utoipa::ToSchema;

pub type ApiResult<T> = Result<T, ApiError>;

#[serde_as]
#[derive(Debug, Serialize, From)]
pub enum ApiError {
    NoAuthIdInRequest,
    NoCtxInRequest,

    // region: external library errors
    #[from]
    Service(services::ServiceError),

    #[from]
    Repositories(repositories::RepositoryError),

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
        let public_error = PublicError::from(self);
        public_error.into_response()
    }
}

pub type PublicResult<T> = Result<T, PublicError>;

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
        let (status, message) = match value {
            ApiError::NoAuthIdInRequest => (StatusCode::BAD_REQUEST, "No auth id in request"),
            ApiError::NoCtxInRequest => (StatusCode::BAD_REQUEST, "No context in request"),
            ApiError::Service(_)
            | ApiError::Repositories(_)
            | ApiError::Config(_)
            | ApiError::Io(_)
            | ApiError::InvalidHeaderValue(_)
            | ApiError::TracingSetGlobalDefault(_)
            | ApiError::TracingFilterParse(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error")
            }
        };

        Self::new(status, message)
    }
}
