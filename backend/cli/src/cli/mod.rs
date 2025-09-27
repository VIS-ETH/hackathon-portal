mod s3;

use crate::cli_config::CliConfig;
use crate::cli_state::CliState;
use crate::CliResult;
use clap::{Parser, Subcommand};
use hackathon_portal_services::logger::Logger;
use std::path::PathBuf;

#[derive(Debug, Subcommand)]
pub enum Command {
    S3(s3::Args),
}

#[derive(Debug, Parser)]
#[command()]
pub struct Args {
    #[clap(long, short, default_value = "config.toml")]
    pub config: PathBuf,

    #[clap(long, short)]
    pub verbose: bool,

    #[clap(subcommand)]
    pub command: Command,
}

pub async fn run() -> CliResult<()> {
    let args = Args::parse();
    let config = CliConfig::parse(&args.config)?;
    let _logger = Logger::setup(&config.dirs, args.verbose, false)?;

    let state = CliState::new(config);

    match &args.command {
        Command::S3(coop_args) => {
            s3::run(&state, &args, coop_args).await?;
        }
    }

    Ok(())
}
