#![deny(clippy::all, clippy::pedantic, clippy::nursery, clippy::cargo)]
#![allow(
    clippy::multiple_crate_versions,
    clippy::cargo_common_metadata,
    clippy::missing_errors_doc,
    clippy::similar_names,
    clippy::module_name_repetitions,
    clippy::future_not_send,
    clippy::assigning_clones,
    clippy::cast_sign_loss,
    clippy::cast_precision_loss,
    clippy::cast_possible_wrap,
    clippy::cast_possible_truncation
)]

pub mod db;
pub mod error;

pub use db::DbRepository;

pub use error::{RepositoryError, RepositoryResult};
