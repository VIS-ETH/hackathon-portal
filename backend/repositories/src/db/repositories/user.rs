use crate::db::generated::user;
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;

pub struct UserRepository;

impl UserRepository {
    pub async fn fetch_by_id<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<user::Model> {
        user::Entity::find_by_id(id)
            .one(db)
            .await?
            .or_fail(user::Entity.table_name(), id)
    }

    pub async fn fetch_by_auth_id_opt<C: ConnectionTrait>(
        db: &C,
        auth_id: &str,
    ) -> RepositoryResult<Option<user::Model>> {
        user::Entity::find()
            .filter(user::Column::AuthId.eq(auth_id))
            .one(db)
            .await
            .map_err(RepositoryError::from)
    }
}
