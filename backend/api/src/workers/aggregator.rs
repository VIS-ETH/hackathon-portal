use crate::api_state::ApiState;
use crate::workers::cron_schedule;
use crate::ApiResult;
use hackathon_portal_repositories::db::EventPhase;
use std::time::Duration;
use tokio_cron_scheduler::Job;
use tracing::{debug, error, info, info_span, Instrument};

const NAME: &str = "aggregator";
const INTERVAL: Duration = Duration::from_mins(5);
const MAX_RUNTIME: Duration = Duration::from_mins(4);

pub fn create_job(api_state: ApiState) -> ApiResult<Job> {
    let job = Job::new_async(cron_schedule(INTERVAL), move |job_id, _| {
        Box::pin({
            let api_state = api_state.clone();
            let span = info_span!("aggregator_job", job_id = %job_id);

            async move {
                let job = async {
                    info!("Starting");

                    match run(api_state.clone()).await {
                        Ok(()) => info!("Finished"),
                        Err(e) => error!(error = %e, "Failed"),
                    }
                };

                match api_state
                    .job_lock_service
                    .run_exclusive(NAME, INTERVAL, MAX_RUNTIME, job)
                    .await
                {
                    Ok(true) => {}
                    Ok(false) => debug!("Skipped, already running or run by another replica"),
                    Err(e) => error!(error = %e, "Job lock failed"),
                }
            }
            .instrument(span)
        })
    })?;

    Ok(job)
}

async fn run(api_state: ApiState) -> ApiResult<()> {
    let events = api_state.event_service.get_events().await?;

    for event in events {
        if event.phase != EventPhase::Hacking {
            continue;
        }

        match api_state.sidequest_service.run_aggregator(event.id).await {
            Ok(_) => info!(event_id = %event.id, event_name = %event.name, "Aggregated sidequests"),
            Err(e) => {
                error!(event_id = %event.id, event_name = %event.name, error = %e, "Failed to aggregate sidequests");
            }
        }
    }

    Ok(())
}
