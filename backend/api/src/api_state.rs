use crate::api_config::ApiConfig;
use crate::ApiResult;
use repositories::DbRepository;
use services::appointment::AppointmentService;
use services::authorization::AuthorizationService;
use services::event::EventService;
use services::project::ProjectService;
use services::sidequest::SidequestService;
use services::user::UserService;
use std::sync::Arc;

#[derive(Clone)]
pub struct ApiState {
    pub authorization_service: Arc<AuthorizationService>,
    pub user_service: Arc<UserService>,
    pub event_service: Arc<EventService>,
    pub project_service: Arc<ProjectService>,
    pub sidequest_service: Arc<SidequestService>,
    pub appointment_service: Arc<AppointmentService>,
}

impl ApiState {
    pub fn new(
        authorization_service: AuthorizationService,
        user_service: UserService,
        event_service: EventService,
        project_service: ProjectService,
        sidequest_service: SidequestService,
        appointment_service: AppointmentService,
    ) -> Self {
        Self {
            authorization_service: Arc::new(authorization_service),
            user_service: Arc::new(user_service),
            event_service: Arc::new(event_service),
            project_service: Arc::new(project_service),
            sidequest_service: Arc::new(sidequest_service),
            appointment_service: Arc::new(appointment_service),
        }
    }

    pub async fn from_config(config: &ApiConfig) -> ApiResult<Self> {
        let db_repo = DbRepository::from_url(&config.db).await?;

        let authorization_service = AuthorizationService::new(db_repo.clone());
        let user_service = UserService::new(db_repo.clone());
        let event_service = EventService::new(db_repo.clone());
        let project_service = ProjectService::new(db_repo.clone());
        let sidequest_service = SidequestService::new(db_repo.clone());
        let appointment_service = AppointmentService::new(db_repo.clone());

        Ok(Self::new(
            authorization_service,
            user_service,
            event_service,
            project_service,
            sidequest_service,
            appointment_service,
        ))
    }
}
