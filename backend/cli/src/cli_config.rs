use crate::{CliError, CliResult};
use config::{Config, Environment};
use directories::ProjectDirs;
use dotenvy::dotenv;
use hackathon_portal_repositories::db::DbConfig;
use hackathon_portal_repositories::s3::S3Config;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CliConfig {
    pub postgres: Option<DbConfig>,
    pub s3: Option<S3Config>,
    #[serde(skip, default = "CliConfig::default_dirs")]
    pub dirs: ProjectDirs,
}

impl CliConfig {
    pub fn default_dirs() -> ProjectDirs {
        ProjectDirs::from("", "vseth-1116-vis-kom-vc2-hackathon", "hackathon-portal")
            .expect("Failed to get project directories")
    }

    pub fn parse(path: &Path) -> CliResult<Self> {
        let _ = dotenv();

        let s = Config::builder()
            .add_source(config::File::with_name(path.to_string_lossy().as_ref()).required(false))
            .add_source(
                Environment::with_prefix("portal")
                    .separator("__")
                    .list_separator(",")
                    .with_list_parse_key("server.allowed_origins")
                    .try_parsing(true),
            )
            .build()?;

        let config = s.try_deserialize()?;

        Ok(config)
    }

    pub fn postgres(&self) -> CliResult<&DbConfig> {
        self.postgres
            .as_ref()
            .ok_or_else(|| CliError::ConfigMissing {
                field: "postgres".to_string(),
            })
    }

    pub fn s3(&self) -> CliResult<&S3Config> {
        self.s3.as_ref().ok_or_else(|| CliError::ConfigMissing {
            field: "s3".to_string(),
        })
    }
}
