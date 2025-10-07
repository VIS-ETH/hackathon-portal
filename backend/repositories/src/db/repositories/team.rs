use crate::db::generated::{event, team};
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::{Condition, QueryOrder};

pub struct TeamRepository;

impl TeamRepository {
    pub async fn fetch_all<C: ConnectionTrait>(db: &C) -> RepositoryResult<Vec<team::Model>> {
        team::Entity::find()
            .order_by_asc(team::Column::Index)
            .order_by_asc(team::Column::Name)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_all_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<team::Model>> {
        team::Entity::find()
            .filter(team::Column::EventId.eq(event_id))
            .order_by_asc(team::Column::Index)
            .order_by_asc(team::Column::Name)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_by_id<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<team::Model> {
        team::Entity::find_by_id(id)
            .one(db)
            .await?
            .or_fail(team::Entity.table_name(), id)
    }

    pub async fn fetch_by_id_with_event<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<(team::Model, event::Model)> {
        let (team, event) = team::Entity::find_by_id(id)
            .find_also_related(event::Entity)
            .one(db)
            .await?
            .or_fail(team::Entity.table_name(), id)?;

        let event = event.expect("Foreign key constraint ensures event exists");

        Ok((team, event))
    }

    pub async fn fetch_by_slug_with_event<C: ConnectionTrait>(
        db: &C,
        event_slug: &str,
        team_slug: &str,
    ) -> RepositoryResult<(team::Model, event::Model)> {
        let (team, event) = team::Entity::find()
            .find_also_related(event::Entity)
            .filter(
                Condition::all()
                    .add(event::Column::Slug.eq(event_slug))
                    .add(team::Column::Slug.eq(team_slug)),
            )
            .one(db)
            .await?
            .or_fail(
                team::Entity.table_name(),
                format!("{event_slug}/{team_slug}"),
            )?;

        let event = event.expect("Foreign key constraint ensures event exists");

        Ok((team, event))
    }

    pub async fn count_conflicting_by_slug<C: ConnectionTrait>(
        db: &C,
        slug: &str,
        event_id: Uuid,
        current_team_id: Option<Uuid>,
    ) -> RepositoryResult<u64> {
        team::Entity::find()
            .filter(
                Condition::all()
                    .add(team::Column::EventId.eq(event_id))
                    .add(team::Column::Slug.eq(slug))
                    .add_option(current_team_id.map(|id| team::Column::Id.ne(id))),
            )
            .count(db)
            .await
            .map_err(RepositoryError::from)
    }
}
