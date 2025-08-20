pub mod db;
pub mod error;

pub use db::DbRepository;

pub use error::{RepositoryError, RepositoryResult};
