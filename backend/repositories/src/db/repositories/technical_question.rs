use crate::db::generated::technical_question;
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::QueryOrder;

pub struct TechnicalQuestionRepository;

impl TechnicalQuestionRepository {
    pub async fn fetch_all_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<technical_question::Model>> {
        technical_question::Entity::find()
            .filter(technical_question::Column::EventId.eq(event_id))
            .order_by_asc(technical_question::Column::Id)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_by_id<C: ConnectionTrait>(
        db: &C,
        question_id: Uuid,
    ) -> RepositoryResult<technical_question::Model> {
        technical_question::Entity::find_by_id(question_id)
            .one(db)
            .await?
            .or_fail(technical_question::Entity.table_name(), question_id)
    }
}
