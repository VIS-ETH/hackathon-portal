use crate::error::ApiResult;
use config::{Config, Environment};
use dotenvy::dotenv;
use hackathon_portal_repositories::db::DbConfig;
use hackathon_portal_repositories::s3::S3Config;
use serde::Deserialize;
use std::net::IpAddr;
use std::path::Path;

#[derive(Debug, Deserialize)]
pub struct ServerConfig {
    pub ip: IpAddr,
    pub port: u16,
}

#[derive(Debug, Deserialize)]
pub struct ApiConfig {
    pub server: ServerConfig,
    pub postgres: DbConfig,
    pub s3: S3Config,
}

impl ApiConfig {
    pub fn parse(path: &Path) -> ApiResult<Self> {
        let _ = dotenv();

        let s = Config::builder()
            .add_source(config::File::with_name(path.to_string_lossy().as_ref()).required(false))
            .add_source(Environment::with_prefix("portal").separator("__"))
            .set_default("server.ip", "127.0.0.1")?
            .set_default("server.port", 8080)?
            .build()?;

        let config = s.try_deserialize()?;

        Ok(config)
    }
}
