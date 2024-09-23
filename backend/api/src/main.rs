mod api_config;
mod error;
mod api_args;

use crate::api_args::ApiArgs;
use crate::api_config::ApiConfig;
use clap::Parser;
pub use error::Result;
use repositories::DbRepository;

#[tokio::main]
async fn main() {
    let args = ApiArgs::parse();
    let config = match ApiConfig::parse(&args.config) {
        Ok(config) => config,
        Err(e) => {
            eprintln!("Error parsing config: {}", e);
            return;
        }
    };

    let db_repo = DbRepository::from_url(&config.db).await.unwrap();

    println!("Hello, world!");

    // dbg!(db_repo);
}
