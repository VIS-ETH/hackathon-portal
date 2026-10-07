pub mod compute;
pub mod input;
pub mod models;

use crate::ranking::models::{Ranking, RankingSnapshot, RankingSnapshotInfo};
use crate::ServiceResult;
use chrono::Utc;
use hackathon_portal_repositories::db::{
    db_ranking_snapshot, EventRepository, RankingSnapshotRepository,
};
use hackathon_portal_repositories::{DbRepository, RepositoryError};
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, Set, TransactionTrait};
use tokio::try_join;

#[derive(Clone)]
pub struct RankingService {
    db_repo: DbRepository,
}

impl RankingService {
    #[must_use]
    pub const fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn live(&self, event_id: Uuid) -> ServiceResult<Ranking> {
        let input = input::load(self.db_repo.conn(), event_id).await?;
        compute::rank(&input)
    }

    /// Returns the given snapshot, or the event's current one if `snapshot_id` is `None`.
    pub async fn get_snapshot(
        &self,
        event_id: Uuid,
        snapshot_id: Option<Uuid>,
    ) -> ServiceResult<Option<RankingSnapshot>> {
        let event = EventRepository::fetch_by_id(self.db_repo.conn(), event_id).await?;

        let Some(snapshot_id) = snapshot_id.or(event.current_ranking_snapshot_id) else {
            return Ok(None);
        };

        let row = RankingSnapshotRepository::fetch_by_id_and_event_id(
            self.db_repo.conn(),
            snapshot_id,
            event_id,
        )
        .await?;

        Ok(Some(RankingSnapshot {
            id: row.id,
            created_at: row.created_at,
            is_current: Some(row.id) == event.current_ranking_snapshot_id,
            // a stored snapshot that doesn't decode is a server error, not a bad request
            ranking: serde_json::from_value(row.data).map_err(RepositoryError::from)?,
        }))
    }

    pub async fn list_snapshots(&self, event_id: Uuid) -> ServiceResult<Vec<RankingSnapshotInfo>> {
        let (event, rows) = try_join!(
            EventRepository::fetch_by_id(self.db_repo.conn(), event_id),
            RankingSnapshotRepository::fetch_infos_by_event_id(self.db_repo.conn(), event_id),
        )?;

        Ok(rows
            .into_iter()
            .map(|row| RankingSnapshotInfo {
                id: row.id,
                created_at: row.created_at,
                is_current: Some(row.id) == event.current_ranking_snapshot_id,
            })
            .collect())
    }

    /// Computes the live ranking, stores it and makes it the event's current snapshot.
    pub async fn create_snapshot(&self, event_id: Uuid) -> ServiceResult<RankingSnapshot> {
        let ranking = self.live(event_id).await?;

        let txn = self.db_repo.conn().begin().await?;

        let row = db_ranking_snapshot::ActiveModel {
            event_id: Set(event_id),
            created_at: Set(Utc::now().naive_utc()),
            data: Set(serde_json::to_value(&ranking)?),
            ..Default::default()
        }
        .insert(&txn)
        .await?;

        Self::set_current(&txn, event_id, row.id).await?;

        txn.commit().await?;

        Ok(RankingSnapshot {
            id: row.id,
            created_at: row.created_at,
            is_current: true,
            ranking,
        })
    }

    pub async fn set_current_snapshot(
        &self,
        event_id: Uuid,
        snapshot_id: Uuid,
    ) -> ServiceResult<RankingSnapshotInfo> {
        let txn = self.db_repo.conn().begin().await?;

        let row = RankingSnapshotRepository::fetch_by_id_and_event_id(&txn, snapshot_id, event_id)
            .await?;
        Self::set_current(&txn, event_id, row.id).await?;

        txn.commit().await?;

        Ok(RankingSnapshotInfo {
            id: row.id,
            created_at: row.created_at,
            is_current: true,
        })
    }

    async fn set_current<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
        snapshot_id: Uuid,
    ) -> ServiceResult<()> {
        let mut active_event = EventRepository::fetch_by_id(db, event_id)
            .await?
            .into_active_model();
        active_event.current_ranking_snapshot_id = Set(Some(snapshot_id));
        active_event.update(db).await?;

        Ok(())
    }
}
