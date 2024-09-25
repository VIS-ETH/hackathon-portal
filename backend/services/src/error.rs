use serde::Serialize;
use std::fmt;
use derive_more::From;
use serde_with::{serde_as, DisplayFromStr};

pub type ServiceResult<T> = Result<T, ServiceError>;

#[serde_as]
#[derive(Debug, Serialize, From)]
pub enum ServiceError {
    NameNotUnique { name: String },

    SlugNotUnique { slug: String },

    // region: external library errors

    #[from]
    SeaORM(#[serde_as(as = "DisplayFromStr")] sea_orm::DbErr),

    // endregion
}

impl fmt::Display for ServiceError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl std::error::Error for ServiceError {}
