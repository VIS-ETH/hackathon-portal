use config::{Config, ConfigError};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct BackendConfig {
    pub database_url: String,
    pub port: u32,
    pub prod: bool
}

impl BackendConfig {
    pub fn new(config_path: &str) -> Result<Self, ConfigError> {
        let s = Config::builder()
            .add_source(config::File::with_name(config_path).required(true))
            .build()?;
        s.try_deserialize()
    }
}

