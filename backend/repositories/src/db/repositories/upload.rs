use crate::db::generated::upload;
use crate::db::OrFailExt;
use crate::RepositoryResult;
use sea_orm::prelude::*;

pub struct UploadRepository;

impl UploadRepository {
    pub async fn fetch_by_id<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<upload::Model> {
        upload::Entity::find_by_id(id)
            .one(db)
            .await?
            .or_fail(upload::Entity.table_name(), id)
    }
}
