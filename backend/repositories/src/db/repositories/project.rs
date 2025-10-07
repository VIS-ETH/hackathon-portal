use crate::db::generated::{event, project};
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::{Condition, QueryOrder};

pub struct ProjectRepository;

impl ProjectRepository {
    pub async fn fetch_all_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<project::Model>> {
        project::Entity::find()
            .filter(project::Column::EventId.eq(event_id))
            .order_by_asc(project::Column::Name)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_by_id<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<project::Model> {
        project::Entity::find_by_id(id)
            .one(db)
            .await?
            .or_fail(project::Entity.table_name(), id)
    }

    pub async fn fetch_by_slug<C: ConnectionTrait>(
        db: &C,
        event_slug: &str,
        project_slug: &str,
    ) -> RepositoryResult<project::Model> {
        project::Entity::find()
            .inner_join(event::Entity)
            .filter(
                Condition::all()
                    .add(event::Column::Slug.eq(event_slug))
                    .add(project::Column::Slug.eq(project_slug)),
            )
            .one(db)
            .await?
            .or_fail(
                project::Entity.table_name(),
                format!("{event_slug}/{project_slug}"),
            )
    }

    pub async fn count_conflicting_by_slug<C: ConnectionTrait>(
        db: &C,
        slug: &str,
        event_id: Uuid,
        current_project_id: Option<Uuid>,
    ) -> RepositoryResult<u64> {
        project::Entity::find()
            .filter(
                Condition::all()
                    .add(project::Column::EventId.eq(event_id))
                    .add(project::Column::Slug.eq(slug))
                    .add_option(current_project_id.map(|id| project::Column::Id.ne(id))),
            )
            .count(db)
            .await
            .map_err(RepositoryError::from)
    }
}
