use axum::http::header::InvalidHeaderValue;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use derive_more::{Display, From};
use serde::Serialize;
use serde_with::{serde_as, DisplayFromStr};
use std::fmt;

pub type ApiResult<T> = Result<T, ApiError>;

#[serde_as]
#[derive(Debug, Serialize, From)]
pub enum ApiError {
    AuthNoCtxInRequest,

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
        // response.extensions_mut().insert(self);
        StatusCode::INTERNAL_SERVER_ERROR.into_response()
    }
}

#[derive(Debug, Display, From)]
pub enum PublicError {
    InternalServerError,
}
