use crate::cli::s3::Args as CoopArgs;
use crate::cli::Args as CliArgs;
use crate::cli_state::CliState;
use crate::CliResult;
use clap::Parser;

#[derive(Parser, Debug)]
pub struct Args {
    pub allowed_origins: Vec<String>,
}

pub async fn run(
    state: &CliState,
    _: &CliArgs,
    _: &CoopArgs,
    setup_cors_args: &Args,
) -> CliResult<()> {
    let s3_config = state.config().s3()?;
    let s3_repo = state.s3_repo().await?;

    println!(
        "Setting CORS configuration for bucket: {}/{}",
        s3_config.endpoint, s3_config.bucket
    );

    println!("Allowed origins: {:?}", setup_cors_args.allowed_origins);

    s3_repo
        .put_bucket_cors(&setup_cors_args.allowed_origins)
        .await?;

    let cors = s3_repo.get_bucket_cors().await?;

    println!("CORS configuration set successfully");
    println!("{:#?}", cors.cors_rules());

    Ok(())
}
