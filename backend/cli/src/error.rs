use derive_more::From;
use serde::Serialize;
use serde_with::{serde_as, DisplayFromStr};

pub type CliResult<T> = Result<T, CliError>;

#[serde_as]
#[derive(Debug, Serialize, From)]
pub enum CliError {
    ConfigMissing {
        field: String,
    },

    // region: external library errors
    #[from]
    Services(hackathon_portal_services::ServiceError),

    #[from]
    Repositories(hackathon_portal_repositories::RepositoryError),
    // endregion

    // region: external library errors
    #[from]
    Config(#[serde_as(as = "DisplayFromStr")] config::ConfigError),

    #[from]
    Dialoguer(#[serde_as(as = "DisplayFromStr")] dialoguer::Error),
    // endregion
}

impl std::fmt::Display for CliError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}

impl std::error::Error for CliError {}
