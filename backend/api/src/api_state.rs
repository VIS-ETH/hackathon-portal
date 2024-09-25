use crate::api_config::ApiConfig;
use crate::Result;
use repositories::DbRepository;
use services::event::EventService;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct ApiState {
    pub event_service: Arc<EventService>,
}

impl ApiState {
    pub fn new(event_service: EventService) -> Self {
        Self {
            event_service: Arc::new(event_service),
        }
    }

    pub async fn from_config(config: &ApiConfig) -> Result<Self> {
        let db_repo = DbRepository::from_url(&config.db).await?;

        let event_service = EventService::new(db_repo);
        
        Ok(Self::new(event_service))
    }
}
