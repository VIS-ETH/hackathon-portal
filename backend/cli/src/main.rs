#![expect(
    clippy::print_stdout,
    clippy::print_stderr,
    reason = "the CLI reports to the terminal"
)]
use crate::cli::run;
use std::process::exit;

mod cli;
mod cli_config;
mod cli_state;
mod error;

pub use error::{CliError, CliResult};

#[tokio::main]
async fn main() {
    if let Err(e) = run().await {
        eprintln!("{e}");
        exit(1);
    }
}
