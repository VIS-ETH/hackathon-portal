use crate::api_config::ApiConfig;
use crate::auth::Authenticator;
use crate::routers::config::models::ClientConfig;
use crate::ApiResult;
use hackathon_portal_repositories::discord::DiscordConfig;
use hackathon_portal_repositories::lite_llm::LiteLLMRepository;
use hackathon_portal_repositories::s3::S3Repository;
use hackathon_portal_repositories::DbRepository;
use hackathon_portal_services::appointment::AppointmentService;
use hackathon_portal_services::authorization::AuthorizationService;
use hackathon_portal_services::crypto::CryptoService;
use hackathon_portal_services::event::EventService;
use hackathon_portal_services::health::HealthService;
use hackathon_portal_services::infrastructure::InfrastructureService;
use hackathon_portal_services::job_lock::JobLockService;
use hackathon_portal_services::project::ProjectService;
use hackathon_portal_services::ranking::RankingService;
use hackathon_portal_services::rating::RatingService;
use hackathon_portal_services::secret::SecretService;
use hackathon_portal_services::sidequest::SidequestService;
use hackathon_portal_services::team::models::Team;
use hackathon_portal_services::team::TeamService;
use hackathon_portal_services::upload::UploadService;
use hackathon_portal_services::user::UserService;
use moka::future::Cache;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

#[derive(Clone)]
pub struct ApiState {
    pub authenticator: Authenticator,
    pub discord_config: Arc<DiscordConfig>,
    pub client_config: Arc<ClientConfig>,
    pub health_service: Arc<HealthService>,
    pub authorization_service: Arc<AuthorizationService>,
    pub user_service: Arc<UserService>,
    pub event_service: Arc<EventService>,
    pub team_service: Arc<TeamService>,
    pub secret_service: Arc<SecretService>,
    pub rating_service: Arc<RatingService>,
    pub ranking_service: Arc<RankingService>,
    pub project_service: Arc<ProjectService>,
    pub sidequest_service: Arc<SidequestService>,
    pub appointment_service: Arc<AppointmentService>,
    pub upload_service: Arc<UploadService>,
    pub infrastructure_service: Arc<InfrastructureService>,
    pub job_lock_service: Arc<JobLockService>,
    pub host_to_team_cache: Cache<(), Arc<HashMap<String, Team>>>,
}

impl ApiState {
    pub async fn from_config(config: &ApiConfig) -> ApiResult<Self> {
        let authenticator = Authenticator::new(&config.auth).await?;

        let db_repo = DbRepository::from_config(&config.postgres).await?;

        let s3_repo = S3Repository::from_config(&config.s3);

        let discord_config = Arc::new(config.discord.clone());
        let client_config = Arc::new(ClientConfig {
            logout_url: config.server.logout_url.clone(),
            litellm_url: config.litellm.as_ref().map(|c| c.base_url().to_string()),
        });
        let lite_llm_repo = config.litellm.as_ref().map(LiteLLMRepository::from_config);

        let crypto_service = Arc::new(CryptoService::from_config(&config.crypto)?);

        let health_service = Arc::new(HealthService::new(db_repo.clone()));
        let authorization_service = Arc::new(AuthorizationService::new(db_repo.clone()));
        let user_service = Arc::new(UserService::new(db_repo.clone()));
        let upload_service = Arc::new(UploadService::new(db_repo.clone(), s3_repo));

        let secret_service = Arc::new(SecretService::new(crypto_service.clone(), db_repo.clone()));

        let team_service = Arc::new(TeamService::new(
            authorization_service.clone(),
            upload_service.clone(),
            crypto_service.clone(),
            secret_service.clone(),
            db_repo.clone(),
            lite_llm_repo,
        ));

        let infrastructure_service = Arc::new(InfrastructureService::new(
            config.infrastructure.clone(),
            team_service.clone(),
        ));

        let sidequest_service = Arc::new(SidequestService::new(
            authorization_service.clone(),
            db_repo.clone(),
        ));

        let rating_service = Arc::new(RatingService::new(db_repo.clone()));

        let ranking_service = Arc::new(RankingService::new(db_repo.clone()));

        let project_service = Arc::new(ProjectService::new(db_repo.clone()));

        let appointment_service = Arc::new(AppointmentService::new(db_repo.clone()));

        let job_lock_service = Arc::new(JobLockService::new(db_repo.clone()));

        let event_service = Arc::new(EventService::new(
            authorization_service.clone(),
            user_service.clone(),
            crypto_service.clone(),
            db_repo,
        ));

        let host_to_team_cache = Cache::builder()
            .time_to_live(Duration::from_secs(10))
            .name("host_to_team_cache")
            .build();

        Ok(Self {
            authenticator,
            discord_config,
            client_config,
            health_service,
            authorization_service,
            user_service,
            event_service,
            team_service,
            secret_service,
            rating_service,
            ranking_service,
            project_service,
            sidequest_service,
            appointment_service,
            upload_service,
            infrastructure_service,
            job_lock_service,
            host_to_team_cache,
        })
    }
}
