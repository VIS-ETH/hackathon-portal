use crate::cli_config::CliConfig;
use crate::CliResult;
use hackathon_portal_repositories::s3::S3Repository;
use hackathon_portal_repositories::DbRepository;
use hackathon_portal_services::appointment::AppointmentService;
use hackathon_portal_services::authorization::AuthorizationService;
use hackathon_portal_services::event::EventService;
use hackathon_portal_services::health::HealthService;
use hackathon_portal_services::project::ProjectService;
use hackathon_portal_services::rating::RatingService;
use hackathon_portal_services::sidequest::SidequestService;
use hackathon_portal_services::team::TeamService;
use hackathon_portal_services::upload::UploadService;
use hackathon_portal_services::user::UserService;
use std::sync::Arc;
use tokio::sync::OnceCell;

#[derive(Clone)]
#[allow(dead_code, clippy::struct_field_names)]
pub struct CliState {
    config: CliConfig,
    pg_repo: OnceCell<Arc<DbRepository>>,
    es_repo: OnceCell<Arc<S3Repository>>,
    health_service: OnceCell<Arc<HealthService>>,
    authorization_service: OnceCell<Arc<AuthorizationService>>,
    user_service: OnceCell<Arc<UserService>>,
    event_service: OnceCell<Arc<EventService>>,
    team_service: OnceCell<Arc<TeamService>>,
    rating_service: OnceCell<Arc<RatingService>>,
    project_service: OnceCell<Arc<ProjectService>>,
    sidequest_service: OnceCell<Arc<SidequestService>>,
    appointment_service: OnceCell<Arc<AppointmentService>>,
    upload_service: OnceCell<Arc<UploadService>>,
}

impl CliState {
    pub fn new(config: CliConfig) -> Self {
        Self {
            config,
            pg_repo: OnceCell::new(),
            es_repo: OnceCell::new(),
            health_service: OnceCell::new(),
            authorization_service: OnceCell::new(),
            user_service: OnceCell::new(),
            event_service: OnceCell::new(),
            team_service: OnceCell::new(),
            rating_service: OnceCell::new(),
            project_service: OnceCell::new(),
            sidequest_service: OnceCell::new(),
            appointment_service: OnceCell::new(),
            upload_service: OnceCell::new(),
        }
    }

    #[allow(dead_code)]
    pub fn config(&self) -> &CliConfig {
        &self.config
    }

    #[allow(dead_code)]
    pub async fn pg_repo(&self) -> CliResult<Arc<DbRepository>> {
        self.pg_repo
            .get_or_try_init(async || {
                let db_config = self.config.postgres()?;
                let db_repo = DbRepository::from_config(db_config).await?;

                Ok(Arc::new(db_repo))
            })
            .await
            .map(Arc::clone)
    }

    pub async fn s3_repo(&self) -> CliResult<Arc<S3Repository>> {
        self.es_repo
            .get_or_try_init(async || {
                let s3_config = self.config.s3()?;
                let s3_repo = S3Repository::from_config(s3_config);

                Ok(Arc::new(s3_repo))
            })
            .await
            .map(Arc::clone)
    }
}
