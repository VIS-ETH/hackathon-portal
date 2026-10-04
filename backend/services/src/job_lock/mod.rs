use crate::ServiceResult;
use hackathon_portal_repositories::db::JobLockRepository;
use hackathon_portal_repositories::DbRepository;
use std::future::Future;
use std::time::Duration;
use tokio::time::timeout;
use tracing::{error, warn};
use uuid::Uuid;

/// Extra lifetime of a lock beyond the job's `max_runtime`,
/// so the job is guaranteed to be cancelled before its lock expires.
const LOCK_MARGIN: Duration = Duration::from_secs(30);

#[derive(Clone)]
pub struct JobLockService {
    db_repo: DbRepository,
}

impl JobLockService {
    #[must_use]
    pub const fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    /// Runs `job` unless another replica is running it or already ran it for the current tick.
    /// The job is cancelled after `max_runtime`. Returns whether `job` was run.
    pub async fn run_exclusive<F: Future<Output = ()>>(
        &self,
        name: &str,
        interval: Duration,
        max_runtime: Duration,
        job: F,
    ) -> ServiceResult<bool> {
        let token = Uuid::new_v4();
        let ttl = max_runtime + LOCK_MARGIN;

        if !JobLockRepository::try_acquire(self.db_repo.conn(), name, token, ttl).await? {
            return Ok(false);
        }

        if timeout(max_runtime, job).await.is_err() {
            error!(job = name, "Timed out after {max_runtime:?}");
        }

        // keep blocking duplicate runs of this tick, but free the lock for the next one
        if !JobLockRepository::release(self.db_repo.conn(), name, token, interval / 2).await? {
            warn!(
                job = name,
                "Lock was taken over by another replica before release, runs may have overlapped"
            );
        }

        Ok(true)
    }
}
