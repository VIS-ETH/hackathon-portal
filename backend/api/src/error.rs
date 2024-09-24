use axum::http::header::InvalidHeaderValue;
use derive_more::{Display, From};

pub type Result<T> = core::result::Result<T, Error>;

#[derive(Debug, Display, From)]
pub enum Error {
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
