use axum::http::header::InvalidHeaderValue;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use derive_more::{Display, From};

pub type Result<T> = core::result::Result<T, Error>;

#[derive(Debug, Display, From)]
pub enum Error {
    AuthNoCtxInRequest,

    #[from]
    Config(config::ConfigError),

    #[from]
    Repositories(repositories::Error),

    #[from]
    Db(repositories::db::Error),

    #[from]
    Io(std::io::Error),

    #[from]
    InvalidHeaderValue(InvalidHeaderValue),

    #[from]
    TracingSetGlobalDefault(tracing::subscriber::SetGlobalDefaultError),

    #[from]
    TracingFilterParse(tracing_subscriber::filter::ParseError),
}

impl std::error::Error for Error {}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let mut response = StatusCode::INTERNAL_SERVER_ERROR.into_response();
        // response.extensions_mut().insert(self);
        response
    }
}


#[derive(Debug, Display, From)]
pub enum ClientError {
    InternalServerError,
}
