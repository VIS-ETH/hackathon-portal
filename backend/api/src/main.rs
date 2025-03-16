mod aggregator;
mod api_args;
mod api_config;
mod api_state;
mod ctx;
mod error;
mod models;
mod mw;
mod routers;
mod utils;

use crate::api_args::ApiArgs;
use crate::api_config::ApiConfig;
use crate::api_state::ApiState;
use crate::routers::get_api_router;
use crate::utils::setup_logging;
use clap::Parser;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tracing::info;

use crate::aggregator::Aggregator;
pub use error::{ApiError, ApiResult, PublicError};

#[tokio::main]
async fn main() -> ApiResult<()> {
    let args = ApiArgs::parse();
    let config = ApiConfig::parse(&args.config)?;

    setup_logging(args.verbose)?;

    let api_state = ApiState::from_config(&config).await?;

    api_state.upload_service.validate_uploads().await?;

    let api_router = get_api_router(api_state.clone()).await?;
    let addr = SocketAddr::new(config.server.ip, config.server.port);
    let listener = TcpListener::bind(&addr).await?;

    let aggregator = Aggregator::new(chrono::Duration::minutes(5), api_state);

    tokio::spawn(async move {
        aggregator.start().await;
    });

    info!(
        "listening on http://{}, docs on http://{}/api/docs",
        addr, addr
    );

    axum::serve(listener, api_router).await?;
    Ok(())
}
