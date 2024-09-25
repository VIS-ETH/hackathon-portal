use std::fmt;
use std::sync::Arc;
use derive_more::{From};
use serde::Serialize;
use serde_with::{serde_as, DisplayFromStr};

pub type RepositoryResult<T> = Result<T, RepositoryError>;

#[serde_as]
#[derive(Debug, Serialize, From)]
pub enum RepositoryError {
    #[from]
    SeaORM(#[serde_as(as = "DisplayFromStr")] sea_orm::DbErr),
}

impl fmt::Display for RepositoryError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl std::error::Error for RepositoryError {}
