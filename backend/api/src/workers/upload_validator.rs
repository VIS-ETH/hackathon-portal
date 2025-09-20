use crate::api_state::ApiState;
use crate::ApiResult;
use tokio_cron_scheduler::Job;
use tracing::{error, info, info_span, Instrument};

pub fn create_job(api_state: ApiState) -> ApiResult<Job> {
    let job = Job::new_async("0 * * * * *", move |job_id, _| {
        // every 1 minute
        Box::pin({
            let api_state = api_state.clone();
            let span = info_span!("upload_validator_job", job_id = %job_id);

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
    api_state.upload_service.validate_uploads().await?;
    Ok(())
}
