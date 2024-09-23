use crate::Result;
use config::{Config, Environment};
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
    pub db: String,
    pub server: ServerConfig,
}

impl ApiConfig {
    pub fn parse(path: &Path) -> Result<Self> {
        let s = Config::builder()
            .add_source(config::File::with_name(path.to_string_lossy().as_ref()).required(false))
            .add_source(Environment::with_prefix("portal").separator("_"))
            .set_default("server.ip", "127.0.0.1")?
            .set_default("server.port", 8080)?
            .build()?;

        let config = s.try_deserialize()?;

        Ok(config)
    }
}
