use crate::api_config::ApiConfig;
use crate::Result;
use repositories::DbRepository;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct ApiState {
    pub db_repo: DbRepository,
}

impl ApiState {
    pub async fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn from_config(config: &ApiConfig) -> Result<Self> {
        let db_repo = DbRepository::from_url(&config.db).await?;
        Ok(Self::new(db_repo).await)
    }
}
