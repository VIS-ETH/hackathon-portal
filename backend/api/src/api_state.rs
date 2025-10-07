use crate::api_config::ApiConfig;
use crate::auth::Authenticator;
use crate::ApiResult;
use hackathon_portal_repositories::discord::DiscordConfig;
use hackathon_portal_repositories::s3::S3Repository;
use hackathon_portal_repositories::DbRepository;
use hackathon_portal_services::appointment::AppointmentService;
use hackathon_portal_services::authorization::AuthorizationService;
use hackathon_portal_services::event::EventService;
use hackathon_portal_services::health::HealthService;
use hackathon_portal_services::infrastructure::InfrastructureService;
use hackathon_portal_services::project::ProjectService;
use hackathon_portal_services::rating::RatingService;
use hackathon_portal_services::sidequest::SidequestService;
use hackathon_portal_services::team::TeamService;
use hackathon_portal_services::upload::UploadService;
use hackathon_portal_services::user::UserService;
use std::sync::Arc;

#[derive(Clone)]
#[allow(clippy::struct_field_names)]
pub struct ApiState {
    pub authenticator: Authenticator,
    pub discord_config: Arc<DiscordConfig>,
    pub health_service: Arc<HealthService>,
    pub authorization_service: Arc<AuthorizationService>,
    pub user_service: Arc<UserService>,
    pub event_service: Arc<EventService>,
    pub team_service: Arc<TeamService>,
    pub rating_service: Arc<RatingService>,
    pub project_service: Arc<ProjectService>,
    pub sidequest_service: Arc<SidequestService>,
    pub appointment_service: Arc<AppointmentService>,
    pub upload_service: Arc<UploadService>,
    pub infrastructure_service: Arc<InfrastructureService>,
}

impl ApiState {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        authenticator: Authenticator,
        discord_config: Arc<DiscordConfig>,
        health_service: Arc<HealthService>,
        authorization_service: Arc<AuthorizationService>,
        user_service: Arc<UserService>,
        event_service: Arc<EventService>,
        team_service: Arc<TeamService>,
        rating_service: Arc<RatingService>,
        project_service: Arc<ProjectService>,
        sidequest_service: Arc<SidequestService>,
        appointment_service: Arc<AppointmentService>,
        upload_service: Arc<UploadService>,
        infrastructure_service: Arc<InfrastructureService>,
    ) -> Self {
        Self {
            authenticator,
            discord_config,
            health_service,
            authorization_service,
            user_service,
            event_service,
            team_service,
            rating_service,
            project_service,
            sidequest_service,
            appointment_service,
            upload_service,
            infrastructure_service,
        }
    }

    pub async fn from_config(config: &ApiConfig) -> ApiResult<Self> {
        let authenticator = Authenticator::new(&config.auth).await?;

        let db_repo = DbRepository::from_config(&config.postgres).await?;

        let s3_repo = S3Repository::from_config(&config.s3);

        let discord_config = Arc::new(config.discord.clone());

        let health_service = Arc::new(HealthService::new(db_repo.clone()));
        let authorization_service = Arc::new(AuthorizationService::new(db_repo.clone()));
        let user_service = Arc::new(UserService::new(db_repo.clone()));
        let upload_service = Arc::new(UploadService::new(db_repo.clone(), s3_repo));

        let team_service = Arc::new(TeamService::new(
            authorization_service.clone(),
            upload_service.clone(),
            db_repo.clone(),
        ));

        let infrastructure_service = Arc::new(InfrastructureService::new(
            config.infrastructure.clone(),
            team_service.clone(),
        ));

        let rating_service = Arc::new(RatingService::new(db_repo.clone()));

        let project_service = Arc::new(ProjectService::new(db_repo.clone()));

        let sidequest_service = Arc::new(SidequestService::new(
            authorization_service.clone(),
            db_repo.clone(),
        ));

        let appointment_service = Arc::new(AppointmentService::new(db_repo.clone()));

        let event_service = Arc::new(EventService::new(
            authorization_service.clone(),
            user_service.clone(),
            sidequest_service.clone(),
            rating_service.clone(),
            db_repo,
        ));

        let state = Self::new(
            authenticator,
            discord_config,
            health_service,
            authorization_service,
            user_service,
            event_service,
            team_service,
            rating_service,
            project_service,
            sidequest_service,
            appointment_service,
            upload_service,
            infrastructure_service,
        );

        Ok(state)
    }
}
