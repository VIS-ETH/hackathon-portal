use std::fmt;
use std::sync::Arc;
use axum::http::header::InvalidHeaderValue;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use derive_more::{Display, From};
use serde::Serialize;
use serde_with::{serde_as, DisplayFromStr};

pub type ApiResult<T> = Result<T, ApiError>;

#[serde_as]
#[derive(Debug, Serialize, From)]
pub enum ApiError {
    AuthNoCtxInRequest,

    #[from]
    Service(services::ServiceError),

    #[from]
    Repositories(repositories::RepositoryError),

    #[from]
    Config(#[serde_as(as = "DisplayFromStr")] config::ConfigError),

    #[from]
    Io(#[serde_as(as = "DisplayFromStr")] std::io::Error),

    #[from]
    InvalidHeaderValue(#[serde_as(as = "DisplayFromStr")] InvalidHeaderValue),

    #[from]
    TracingSetGlobalDefault(#[serde_as(as = "DisplayFromStr"
    )] tracing::subscriber::SetGlobalDefaultError),

    #[from]
    TracingFilterParse(#[serde_as(as = "DisplayFromStr")] tracing_subscriber::filter::ParseError),
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl std::error::Error for ApiError {}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let mut response = StatusCode::INTERNAL_SERVER_ERROR.into_response();
        // response.extensions_mut().insert(self);
        response
    }
}

#[derive(Debug, Display, From)]
pub enum PublicError {
    InternalServerError,
}
