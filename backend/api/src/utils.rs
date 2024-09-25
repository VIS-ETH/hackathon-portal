use crate::{ApiResult};
use std::str::FromStr;
use tracing_subscriber::filter::Directive;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::EnvFilter;

pub fn setup_logging(verbose: bool) -> ApiResult<()> {
    let (stdout_writer, stdout_guard) = tracing_appender::non_blocking(std::io::stdout());

    Box::leak(Box::new(stdout_guard));

    let stdout_layer = tracing_subscriber::fmt::layer().with_writer(stdout_writer);

    let directive_str = if verbose { "debug" } else { "api=info" };

    let directive = Directive::from_str(&directive_str)?;
    let filter = EnvFilter::from_default_env().add_directive(directive);
    let subscriber = tracing_subscriber::registry()
        .with(stdout_layer)
        .with(filter);

    tracing::subscriber::set_global_default(subscriber)?;

    Ok(())
}
