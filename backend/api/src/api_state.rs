use crate::api_config::ApiConfig;
use crate::ApiResult;
use repositories::DbRepository;
use services::appointment::AppointmentService;
use services::authorization::AuthorizationService;
use services::event::EventService;
use services::project::ProjectService;
use services::sidequest::SidequestService;
use services::team::TeamService;
use services::user::UserService;
use std::sync::Arc;

#[derive(Clone)]
pub struct ApiState {
    pub authorization_service: Arc<AuthorizationService>,
    pub user_service: Arc<UserService>,
    pub event_service: Arc<EventService>,
    pub team_service: Arc<TeamService>,
    pub project_service: Arc<ProjectService>,
    pub sidequest_service: Arc<SidequestService>,
    pub appointment_service: Arc<AppointmentService>,
}

impl ApiState {
    pub fn new(
        authorization_service: Arc<AuthorizationService>,
        user_service: Arc<UserService>,
        event_service: Arc<EventService>,
        team_service: Arc<TeamService>,
        project_service: Arc<ProjectService>,
        sidequest_service: Arc<SidequestService>,
        appointment_service: Arc<AppointmentService>,
    ) -> Self {
        Self {
            authorization_service,
            user_service,
            event_service,
            team_service,
            project_service,
            sidequest_service,
            appointment_service,
        }
    }

    pub async fn from_config(config: &ApiConfig) -> ApiResult<Self> {
        let db_repo = DbRepository::from_url(&config.db).await?;

        let authorization_service = Arc::new(AuthorizationService::new(db_repo.clone()));
        let user_service = Arc::new(UserService::new(db_repo.clone()));
        let event_service = Arc::new(EventService::new(db_repo.clone()));
        let team_service = Arc::new(TeamService::new(
            authorization_service.clone(),
            db_repo.clone(),
        ));
        let project_service = Arc::new(ProjectService::new(db_repo.clone()));
        let sidequest_service = Arc::new(SidequestService::new(db_repo.clone()));
        let appointment_service = Arc::new(AppointmentService::new(db_repo.clone()));

        let state = Self::new(
            authorization_service,
            user_service,
            event_service,
            team_service,
            project_service,
            sidequest_service,
            appointment_service,
        );

        Ok(state)
    }
}
