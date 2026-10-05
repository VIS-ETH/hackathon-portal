use crate::db::generated::{technical_question, technical_rating};
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::{JoinType, QuerySelect};

pub struct TechnicalRatingRepository;

impl TechnicalRatingRepository {
    pub async fn fetch_all_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<technical_rating::Model>> {
        technical_rating::Entity::find()
            .join(
                JoinType::InnerJoin,
                technical_rating::Relation::TechnicalQuestion.def(),
            )
            .filter(technical_question::Column::EventId.eq(event_id))
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }
}
