use crate::api_config::ApiConfig;
use crate::ApiResult;
use repositories::DbRepository;
use services::event::EventService;
use services::user::UserService;
use std::sync::Arc;

#[derive(Clone)]
pub struct ApiState {
    pub event_service: Arc<EventService>,
    pub user_service: Arc<UserService>,
}

impl ApiState {
    pub fn new(event_service: EventService, user_service: UserService) -> Self {
        Self {
            event_service: Arc::new(event_service),
            user_service: Arc::new(user_service),
        }
    }

    pub async fn from_config(config: &ApiConfig) -> ApiResult<Self> {
        let db_repo = DbRepository::from_url(&config.db).await?;

        let event_service = EventService::new(db_repo.clone());
        let user_service = UserService::new(db_repo);

        Ok(Self::new(event_service, user_service))
    }
}
