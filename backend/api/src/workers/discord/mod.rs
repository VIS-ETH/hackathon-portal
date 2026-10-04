use crate::api_state::ApiState;
use crate::workers::cron_schedule;
use crate::workers::discord::client::DiscordClient;
use crate::ApiResult;
use hackathon_portal_services::ServiceResult;
use std::time::Duration;
use tokio_cron_scheduler::Job;
use tracing::{debug, error, info, info_span, warn, Instrument};
mod client;
mod config;

const NAME: &str = "discord_sync";
const INTERVAL: Duration = Duration::from_mins(2);
// syncing can be slow due to Discord's rate limits, ticks during a long run are skipped
const MAX_RUNTIME: Duration = Duration::from_mins(10);

pub fn create_job(api_state: ApiState) -> ApiResult<Job> {
    let job = Job::new_async(cron_schedule(INTERVAL), move |job_id, _| {
        Box::pin({
            let api_state = api_state.clone();
            let span = info_span!("discord_sync", job_id = %job_id);

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

pub async fn run(api_state: ApiState) -> ServiceResult<()> {
    info!("Discord sync task running...");

    // Launch Client here
    match DiscordClient::new(&api_state).await {
        Ok(client) => {
            info!("Discord client created successfully");

            // Get all events
            let events = api_state.event_service.get_events().await?;
            info!("Fetched {} events from the database", events.len());

            // Loop through events to find Discord configurations
            for event in events {
                info!("Processing event: {} (ID: {})", event.name, event.id);

                // Check if event has a discord server id
                if let Some(discord_server_id) = &event.discord_server_id {
                    debug!("Event has Discord server ID: {}", discord_server_id);

                    // Check guild membership
                    match client
                        .check_guild_membership(discord_server_id.clone())
                        .await
                    {
                        Ok(true) => {
                            debug!("✅ Bot is part of target server: {}", discord_server_id);
                            match client.sync_configuration(&api_state, &event).await {
                                Ok(()) => info!(
                                    "Successfully synced configuration for event: {} (ID: {})",
                                    event.name, event.id
                                ),
                                Err(e) => error!(
                                    "Failed to sync configuration for event: {} (ID: {}): {}",
                                    event.name, event.id, e
                                ),
                            }
                        }
                        Ok(false) => {
                            warn!("❌ Bot is NOT part of target server: {}", discord_server_id);
                        }
                        Err(e) => {
                            error!("Failed to check guild membership: {}", e);
                        }
                    }
                } else {
                    info!("Event does not have a Discord server ID configured.");
                }
            }
        }
        Err(e) => {
            error!("Failed to create Discord client: {}", e);
        }
    }

    info!("Discord server setup completed successfully");
    Ok(())
}
