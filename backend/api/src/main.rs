mod api_args;
mod api_config;
mod api_state;
mod error;
mod routers;

use crate::api_args::ApiArgs;
use crate::api_config::ApiConfig;
use crate::api_state::ApiState;
use crate::routers::get_api_router;
use clap::Parser;
pub use error::Result;
use repositories::DbRepository;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tracing::info;

#[tokio::main]
async fn main() -> Result<()> {
    let args = ApiArgs::parse();
    let config = ApiConfig::parse(&args.config)?;

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
