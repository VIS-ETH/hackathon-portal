use crate::db::generated::ranking_snapshot;
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::{DerivePartialModel, FromQueryResult, QueryOrder};

#[derive(DerivePartialModel, FromQueryResult, Debug, Clone)]
#[sea_orm(entity = "ranking_snapshot::Entity")]
pub struct RankingSnapshotRow {
    pub id: Uuid,
    pub created_at: DateTime,
}

pub struct RankingSnapshotRepository;

impl RankingSnapshotRepository {
    pub async fn fetch_by_id_and_event_id<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
        event_id: Uuid,
    ) -> RepositoryResult<ranking_snapshot::Model> {
        ranking_snapshot::Entity::find_by_id(id)
            .filter(ranking_snapshot::Column::EventId.eq(event_id))
            .one(db)
            .await?
            .or_fail(ranking_snapshot::Entity.table_name(), id)
    }

    pub async fn fetch_infos_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<RankingSnapshotRow>> {
        ranking_snapshot::Entity::find()
            .filter(ranking_snapshot::Column::EventId.eq(event_id))
            .order_by_desc(ranking_snapshot::Column::CreatedAt)
            .into_partial_model::<RankingSnapshotRow>()
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }
}
