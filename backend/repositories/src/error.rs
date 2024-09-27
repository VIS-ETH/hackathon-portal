use derive_more::From;
use serde::Serialize;
use serde_with::{serde_as, DisplayFromStr};
use std::fmt::{self, write};

use crate::db::prelude::EventPhase;

pub type RepositoryResult<T> = Result<T, RepositoryError>;

#[serde_as]
#[derive(Debug, Serialize, From)]
pub enum RepositoryError {
    // region: external library errors
    #[from]
    SeaORM(#[serde_as(as = "DisplayFromStr")] sea_orm::DbErr),
    // endregion
}

impl fmt::Display for RepositoryError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl fmt::Display for EventPhase {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let string = match self {
            EventPhase::Grading => "Grading",
            EventPhase::Hacking => "Hacking",
            EventPhase::Registration => "Registration",
            EventPhase::Readonly => "Readonly",
        };
        write!(f, "{:?}", string)
    }
}

impl std::error::Error for RepositoryError {}
