use crate::ServiceResult;
use hackathon_portal_repositories::DbRepository;
use std::time::Duration;

#[derive(Clone)]
pub struct HealthService {
    db_repo: DbRepository,
}

impl HealthService {
    #[must_use]
    pub const fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub fn check_liveness(&self) -> ServiceResult<()> {
        Ok(())
    }

    pub async fn check_readiness(&self) -> ServiceResult<()> {
        self.db_repo.ping(Duration::from_secs(1)).await?;
        Ok(())
    }
}
