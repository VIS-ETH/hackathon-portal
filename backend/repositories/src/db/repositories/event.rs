use crate::db::generated::event;
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::{Condition, QueryOrder};

pub struct EventRepository;

impl EventRepository {
    pub async fn fetch_all<C: ConnectionTrait>(db: &C) -> RepositoryResult<Vec<event::Model>> {
        event::Entity::find()
            .order_by_desc(event::Column::Start)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_by_id<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<event::Model> {
        event::Entity::find_by_id(id)
            .one(db)
            .await?
            .or_fail(event::Entity.table_name(), id)
    }

    pub async fn fetch_by_slug<C: ConnectionTrait>(
        db: &C,
        slug: &str,
    ) -> RepositoryResult<event::Model> {
        event::Entity::find()
            .filter(event::Column::Slug.eq(slug))
            .one(db)
            .await?
            .or_fail(event::Entity.table_name(), slug)
    }

    pub async fn count_conflicting_by_slug<C: ConnectionTrait>(
        db: &C,
        slug: &str,
        current_id: Option<Uuid>,
    ) -> RepositoryResult<u64> {
        event::Entity::find()
            .filter(
                Condition::all()
                    .add(event::Column::Slug.eq(slug))
                    .add_option(current_id.map(|id| event::Column::Id.ne(id))),
            )
            .count(db)
            .await
            .map_err(RepositoryError::from)
    }
}
