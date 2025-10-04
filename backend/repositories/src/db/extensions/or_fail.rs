use crate::{RepositoryError, RepositoryResult};
use sea_orm::{EntityName, ModelTrait};
use std::fmt::Display;

pub trait OrFailExt<T: ModelTrait> {
    fn or_fail(self, entity: T::Entity, identifier: impl Display) -> RepositoryResult<T>;
}

impl<T> OrFailExt<T> for Option<T>
where
    T: ModelTrait,
{
    fn or_fail(self, entity: T::Entity, identifier: impl Display) -> RepositoryResult<T> {
        self.ok_or_else(|| RepositoryError::EntityNotFound {
            entity: entity.table_name().to_string(),
            identifier: identifier.to_string(),
        })
    }
}
