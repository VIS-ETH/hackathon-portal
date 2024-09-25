use serde::Serialize;
use std::fmt;

pub type ServiceResult<T> = Result<T, ServiceError>;

#[derive(Debug, Serialize)]
pub enum ServiceError {
    NameNotUnique { name: String },

    SlugNotUnique { slug: String },
}

impl fmt::Display for ServiceError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl std::error::Error for ServiceError {}
