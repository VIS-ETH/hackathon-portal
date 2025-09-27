use crate::ServiceResult;
use directories::ProjectDirs;
use std::fs::create_dir_all;
use std::path::Path;
use tracing::{info, Subscriber};
use tracing_appender::non_blocking::WorkerGuard;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::registry::LookupSpan;
use tracing_subscriber::{fmt, EnvFilter, Layer, Registry};

pub struct Logger {
    _file_guard: WorkerGuard,
}

impl Logger {
    pub fn setup(dirs: &ProjectDirs, verbose: bool, json: bool) -> ServiceResult<Self> {
        let log_dir = dirs.data_dir().join("logs");
        create_dir_all(&log_dir)?;

        let default_env_filter = if verbose {
            "debug"
        } else {
            "warn,hackathon_portal_=info"
        };

        let env_filter = EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| EnvFilter::new(default_env_filter));

        let stdout_layer = Self::setup_stdout(json);
        let (file_layer, file_guard) = Self::setup_file(&log_dir)?;

        let registry = Registry::default()
            .with(env_filter)
            .with(stdout_layer)
            .with(file_layer);

        tracing::subscriber::set_global_default(registry)?;

        info!(log_dir = ?log_dir, "Logger initialized");

        Ok(Self {
            _file_guard: file_guard,
        })
    }

    fn setup_stdout<S>(json: bool) -> Box<dyn Layer<S> + Send + Sync>
    where
        S: Subscriber + for<'a> LookupSpan<'a>,
    {
        let base = fmt::layer()
            .with_ansi(true)
            .with_target(true)
            .with_line_number(false)
            .with_file(false)
            .with_thread_ids(false)
            .with_thread_names(false)
            .with_writer(std::io::stdout);

        if json {
            Box::new(base.json())
        } else {
            Box::new(base.compact())
        }
    }

    fn setup_file<S>(log_dir: &Path) -> ServiceResult<(impl Layer<S>, WorkerGuard)>
    where
        S: Subscriber + for<'a> LookupSpan<'a>,
    {
        let appender = RollingFileAppender::builder()
            .rotation(Rotation::DAILY)
            .filename_suffix("log")
            .build(log_dir)?;

        let (writer, guard) = tracing_appender::non_blocking(appender);

        let layer = fmt::layer()
            .json()
            .with_ansi(false)
            .with_target(true)
            .with_line_number(true)
            .with_file(true)
            .with_thread_ids(true)
            .with_thread_names(true)
            .with_writer(writer);

        Ok((layer, guard))
    }
}
