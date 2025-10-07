use crate::db::generated::expert_rating;
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::QueryOrder;

pub struct ExpertRatingRepository;

impl ExpertRatingRepository {
    pub async fn fetch_all_by_team_id<C: ConnectionTrait>(
        db: &C,
        team_id: Uuid,
    ) -> RepositoryResult<Vec<expert_rating::Model>> {
        expert_rating::Entity::find()
            .filter(expert_rating::Column::TeamId.eq(team_id))
            .order_by_asc(expert_rating::Column::Id)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_by_id<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<expert_rating::Model> {
        expert_rating::Entity::find_by_id(id)
            .one(db)
            .await?
            .or_fail(expert_rating::Entity.table_name(), id)
    }
}
