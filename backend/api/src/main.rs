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
use repositories::db::prelude::EventPhase;
use std::{net::SocketAddr, time::Duration};
use tokio::{net::TcpListener, task, time};
use tracing::info;

pub use error::{ApiError, ApiResult, PublicError};

#[tokio::main]
async fn main() -> ApiResult<()> {
    let args = ApiArgs::parse();
    let config = ApiConfig::parse(&args.config)?;

    setup_logging(args.verbose)?;

    let api_state = ApiState::from_config(&config).await?;

    let api_router = get_api_router(api_state).await?;
    let addr = SocketAddr::new(config.server.ip, config.server.port);
    let listener = TcpListener::bind(&addr).await?;

    info!(
        "listening on http://{}, docs on http://{}/api/docs",
        addr, addr
    );

    axum::serve(listener, api_router).await?;
    Ok(())
}
