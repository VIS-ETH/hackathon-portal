use axum::body::Body;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use derive_more::Display;
use crate::error::Error;

#[derive(Debug, Display)]
pub enum ApiError {}

pub type ApiResult<T> = Result<T, Error>;


impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        StatusCode::INTERNAL_SERVER_ERROR.into_response()
    }
}

impl From<Error> for ApiError {
    fn from(err: Error) -> Self {
        unimplemented!()
    }
}


impl std::error::Error for ApiError {}