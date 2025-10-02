use crate::auth::AuthConfig;
use crate::error::ApiResult;
use config::{Config, Environment};
use directories::ProjectDirs;
use dotenvy::dotenv;
use hackathon_portal_repositories::db::DbConfig;
use hackathon_portal_repositories::discord::DiscordConfig;
use hackathon_portal_repositories::s3::S3Config;
use serde::{Deserialize, Serialize};
use std::net::{IpAddr, Ipv4Addr};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ServerConfig {
    #[serde(default = "ServerConfig::default_ip")]
    pub ip: IpAddr,

    #[serde(default = "ServerConfig::default_port")]
    pub port: u16,

    #[serde(default = "ServerConfig::default_management_port")]
    pub management_port: u16,

    pub allowed_origins: Option<Vec<String>>,
}

impl ServerConfig {
    pub fn default_ip() -> IpAddr {
        IpAddr::V4(Ipv4Addr::LOCALHOST)
    }

    pub fn default_port() -> u16 {
        8000
    }

    pub fn default_management_port() -> u16 {
        8001
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ApiConfig {
    pub server: ServerConfig,
    pub auth: AuthConfig,
    pub postgres: DbConfig,
    pub s3: S3Config,
    pub discord: DiscordConfig,
    #[serde(skip, default = "ApiConfig::default_dirs")]
    pub dirs: ProjectDirs,
}

impl ApiConfig {
    pub fn default_dirs() -> ProjectDirs {
        ProjectDirs::from("", "vseth-1116-vis-kom-vc2-hackathon", "hackathon-portal")
            .expect("Failed to get project directories")
    }

    pub fn parse(path: &Path) -> ApiResult<Self> {
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
}
