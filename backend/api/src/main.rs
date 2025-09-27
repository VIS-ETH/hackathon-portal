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
mod utils;
mod workers;

use crate::api_args::ApiArgs;
use crate::api_config::ApiConfig;
use crate::api_state::ApiState;
use crate::server::Server;
use crate::utils::setup_logging;
use crate::workers::Workers;
use clap::Parser;
pub use error::{ApiError, ApiResult};
use tokio::try_join;

#[tokio::main]
async fn main() -> ApiResult<()> {
    let args = ApiArgs::parse();
    let config = ApiConfig::parse(&args.config)?;

    setup_logging(args.verbose)?;

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
