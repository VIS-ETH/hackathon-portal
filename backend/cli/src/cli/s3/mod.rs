mod setup_cors;

use crate::cli_state::CliState;
use crate::CliResult;
use clap::{Parser, Subcommand};

#[derive(Debug, Subcommand)]
pub enum Command {
    SetupCors(setup_cors::Args),
}

#[derive(Debug, Parser)]
pub struct Args {
    #[clap(subcommand)]
    pub command: Command,
}

pub async fn run(state: &CliState, cli_args: &crate::cli::Args, s3_args: &Args) -> CliResult<()> {
    match &s3_args.command {
        Command::SetupCors(setup_cors_args) => {
            setup_cors::run(state, cli_args, s3_args, setup_cors_args).await?;
        }
    }

    Ok(())
}
