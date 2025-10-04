use crate::api_state::ApiState;
use crate::ApiResult;
use hackathon_portal_repositories::db::EventPhase;
use tokio_cron_scheduler::Job;
use tracing::{error, info, info_span, Instrument};

pub fn create_job(api_state: ApiState) -> ApiResult<Job> {
    let job = Job::new_async("0 */5 * * * *", move |job_id, _| {
        // every 5 minutes
        Box::pin({
            let api_state = api_state.clone();
            let span = info_span!("aggregator_job", job_id = %job_id);

            async move {
                info!("Starting");

                match run(api_state).await {
                    Ok(()) => info!("Finished"),
                    Err(e) => error!(error = %e, "Failed"),
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
