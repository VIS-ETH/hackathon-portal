use crate::api_state::ApiState;
use chrono::{DurationRound, Utc};
use hackathon_portal_repositories::db::prelude::EventPhase;
use hackathon_portal_services::ServiceResult;
use std::time::Duration;
use tokio::time::sleep;
use tracing::{error, info};

pub struct Aggregator {
    interval: chrono::Duration,
    api_state: ApiState,
}

impl Aggregator {
    pub fn new(interval: chrono::Duration, api_state: ApiState) -> Self {
        Self {
            interval,
            api_state,
        }
    }

    pub async fn start(&self) {
        loop {
            let Some(sleep_duration) = self.get_sleep_duration() else {
                error!("No sleep duration found, skipping");
                continue;
            };

            info!("Sleeping for {:?}", sleep_duration);
            sleep(sleep_duration).await;

            if let Err(e) = self.run().await {
                error!("Failed to run aggregator: {}", e);
            } else {
                info!("Aggregator run complete");
            }
        }
    }

    pub async fn run(&self) -> ServiceResult<()> {
        let events = self.api_state.event_service.get_events().await?;

        for event in events {
            if event.phase != EventPhase::Hacking {
                continue;
            }

            if let Err(e) = self
                .api_state
                .sidequest_service
                .run_aggregator(event.id)
                .await
            {
                error!("Failed to run aggregator for event {}: {}", event.id, e);
            }
        }

        Ok(())
    }

    fn get_sleep_duration(&self) -> Option<Duration> {
        let now = Utc::now().naive_utc();
        let trunc_now = now.duration_trunc(self.interval).ok()?;
        let next_run = trunc_now + self.interval;

        let sleep_duration = (next_run - now).to_std().ok()?;

        Some(sleep_duration)
    }
}
