use crate::db::generated::{jury_rating, team};
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::{JoinType, QueryOrder, QuerySelect};

pub struct JuryRatingRepository;

impl JuryRatingRepository {
    pub async fn fetch_all_by_team_id<C: ConnectionTrait>(
        db: &C,
        team_id: Uuid,
    ) -> RepositoryResult<Vec<jury_rating::Model>> {
        jury_rating::Entity::find()
            .filter(jury_rating::Column::TeamId.eq(team_id))
            .order_by_asc(jury_rating::Column::Id)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_all_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<jury_rating::Model>> {
        jury_rating::Entity::find()
            .join(JoinType::InnerJoin, jury_rating::Relation::Team.def())
            .filter(team::Column::EventId.eq(event_id))
            .order_by_asc(jury_rating::Column::Id)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_by_id<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<jury_rating::Model> {
        jury_rating::Entity::find_by_id(id)
            .one(db)
            .await?
            .or_fail(jury_rating::Entity.table_name(), id)
    }
}
