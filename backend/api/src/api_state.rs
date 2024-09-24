use crate::api_config::ApiConfig;
use crate::Result;
use repositories::DbRepository;
use services::event::{DefaultEventService, EventService};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct ApiState<EventS>
where
    EventS: EventService,
{
    pub event_service: Arc<EventS>,
}

impl<EventS> ApiState<EventS>
where
    EventS: EventService,
{
    pub async fn new(event_service: EventS) -> Self {
        Self {
            event_service: Arc::new(event_service),
        }
    }

    pub async fn default_from_config(config: &ApiConfig) -> Result<Self> {
        let db_repo = DbRepository::from_url(&config.db).await?;
        let event_service = DefaultEventService::new(db_repo).await;
        Ok(Self::new(db_repo).await)
    }
}
