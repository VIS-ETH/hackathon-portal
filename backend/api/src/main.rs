mod api_args;
mod api_config;
mod api_state;
mod auth;
mod ctx;
mod error;
mod management_routers;
mod models;
mod mw;
mod routers;
mod server;
mod workers;

use crate::api_args::ApiArgs;
use crate::api_config::ApiConfig;
use crate::api_state::ApiState;
use crate::server::Server;
use crate::workers::Workers;
use clap::Parser;
pub use error::{ApiError, ApiResult};
use hackathon_portal_services::logger::Logger;
use tokio::try_join;

#[tokio::main]
async fn main() -> ApiResult<()> {
    let args = ApiArgs::parse();
    let config = ApiConfig::parse(&args.config)?;
    let _logger = Logger::setup(&config.dirs, args.verbose, args.json)?;

    let api_state = ApiState::from_config(&config).await?;

    Workers::new(api_state.clone()).await?.start().await?;

    let server = Server::new(
        "api",
        config.server.ip,
        config.server.port,
        routers::get_router(api_state.clone()),
        routers::get_docs(),
        config.server.allowed_origins.clone(),
    );

    let management_server = Server::new(
        "management api",
        config.server.ip,
        config.server.management_port,
        management_routers::get_router(api_state),
        management_routers::get_docs(),
        config.server.allowed_origins,
    );

    try_join!(server.serve(), management_server.serve())?;

    Ok(())
}
