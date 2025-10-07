use crate::{RepositoryError, RepositoryResult};
use std::fmt::Display;

pub trait OrFailExt<T> {
    fn or_fail(self, entity: impl Display, identifier: impl Display) -> RepositoryResult<T>;
}

impl<T> OrFailExt<T> for Option<T> {
    fn or_fail(self, entity: impl Display, identifier: impl Display) -> RepositoryResult<T> {
        self.ok_or_else(|| RepositoryError::EntityNotFound {
            entity: entity.to_string(),
            identifier: identifier.to_string(),
        })
    }
}
