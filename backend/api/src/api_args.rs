use clap::Parser;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command()]
pub struct ApiArgs {
    #[clap(long, short, default_value = "config.toml")]
    pub config: PathBuf,

    #[clap(long, short)]
    pub verbose: bool,

    #[clap(long)]
    pub json: bool,
}
