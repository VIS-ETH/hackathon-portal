use crate::db::generated::{event, sidequest};
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::{Condition, QueryOrder};

pub struct SidequestRepository;

impl SidequestRepository {
    pub async fn fetch_all_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<sidequest::Model>> {
        sidequest::Entity::find()
            .filter(sidequest::Column::EventId.eq(event_id))
            .order_by_asc(sidequest::Column::Name)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_by_id<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<sidequest::Model> {
        sidequest::Entity::find_by_id(id)
            .one(db)
            .await?
            .or_fail(sidequest::Entity, id)
    }

    pub async fn fetch_by_slug<C: ConnectionTrait>(
        db: &C,
        event_slug: &str,
        sidequest_slug: &str,
    ) -> RepositoryResult<sidequest::Model> {
        sidequest::Entity::find()
            .inner_join(event::Entity)
            .filter(
                Condition::all()
                    .add(event::Column::Slug.eq(event_slug))
                    .add(sidequest::Column::Slug.eq(sidequest_slug)),
            )
            .one(db)
            .await?
            .or_fail(sidequest::Entity, format!("{event_slug}/{sidequest_slug}"))
    }

    pub async fn count_conflicting_by_slug<C: ConnectionTrait>(
        db: &C,
        slug: &str,
        event_id: Uuid,
        current_sidequest_id: Option<Uuid>,
    ) -> RepositoryResult<u64> {
        sidequest::Entity::find()
            .filter(
                Condition::all()
                    .add(sidequest::Column::EventId.eq(event_id))
                    .add(sidequest::Column::Slug.eq(slug))
                    .add_option(current_sidequest_id.map(|id| sidequest::Column::Id.ne(id))),
            )
            .count(db)
            .await
            .map_err(RepositoryError::from)
    }
}
