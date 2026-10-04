use crate::api_state::ApiState;
use crate::ApiResult;
use std::time::Duration;
use tokio_cron_scheduler::JobScheduler;
use tracing::info;

mod aggregator;
mod discord;

/// Cron schedule firing every `interval`, aligned to the wall clock,
/// so that all replicas fire at the same instants.
///
/// # Panics
/// If `interval` isn't a whole number of minutes dividing an hour,
/// as the schedule would then not fire evenly.
fn cron_schedule(interval: Duration) -> String {
    let minutes = interval.as_secs() / 60;
    assert!(
        interval == Duration::from_mins(minutes) && minutes > 0 && 60 % minutes == 0,
        "interval must be a whole number of minutes dividing 60, got {interval:?}"
    );
    format!("0 */{minutes} * * * *")
}

pub struct Workers {
    scheduler: JobScheduler,
}

impl Workers {
    pub async fn new(api_state: ApiState) -> ApiResult<Self> {
        let scheduler = JobScheduler::new().await?;

        scheduler
            .add(aggregator::create_job(api_state.clone())?)
            .await?;

        scheduler
            .add(discord::create_job(api_state.clone())?)
            .await?;

        Ok(Self { scheduler })
    }

    pub async fn start(&self) -> ApiResult<()> {
        self.scheduler.start().await?;
        info!("Workers started");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cron_schedule_accepts_minutes_dividing_an_hour() {
        assert_eq!(cron_schedule(Duration::from_mins(2)), "0 */2 * * * *");
        assert_eq!(cron_schedule(Duration::from_hours(1)), "0 */60 * * * *");
    }

    #[test]
    fn cron_schedule_is_accepted_by_scheduler() {
        for minutes in [1, 2, 5, 15, 30, 60] {
            let schedule = cron_schedule(Duration::from_mins(minutes));
            let job =
                tokio_cron_scheduler::Job::new_async(schedule.as_str(), |_, _| Box::pin(async {}));
            assert!(job.is_ok(), "{schedule} rejected");
        }
    }

    #[test]
    #[should_panic(expected = "dividing 60")]
    fn cron_schedule_rejects_minutes_not_dividing_an_hour() {
        cron_schedule(Duration::from_mins(7));
    }

    #[test]
    #[should_panic(expected = "whole number of minutes")]
    fn cron_schedule_rejects_partial_minutes() {
        cron_schedule(Duration::from_secs(90));
    }
}
