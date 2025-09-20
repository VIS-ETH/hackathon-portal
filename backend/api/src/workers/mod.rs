use crate::api_state::ApiState;
use crate::ApiResult;
use tokio_cron_scheduler::JobScheduler;
use tracing::info;

mod aggregator;

pub struct Workers {
    scheduler: JobScheduler,
}

impl Workers {
    pub async fn new(api_state: ApiState) -> ApiResult<Self> {
        let scheduler = JobScheduler::new().await?;

        scheduler
            .add(aggregator::create_job(api_state.clone())?)
            .await?;

        Ok(Self { scheduler })
    }

    pub async fn start(&self) -> ApiResult<()> {
        self.scheduler.start().await?;
        info!("Workers started");
        Ok(())
    }
}
