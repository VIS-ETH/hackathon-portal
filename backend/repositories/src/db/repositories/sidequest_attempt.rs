use crate::db::generated::{event, sidequest, sidequest_attempt, team_role_assignment, user};
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::sqlx::types::chrono::NaiveDateTime;
use sea_orm::{Condition, FromQueryResult, JoinType, QueryOrder, QuerySelect};

impl sidequest_attempt::Entity {
    #[must_use]
    pub fn find_in_interval(
        after: Option<NaiveDateTime>,
        before: Option<NaiveDateTime>,
    ) -> Select<Self> {
        sidequest_attempt::Entity::find()
            .filter(
                Condition::all()
                    .add_option(after.map(|v| sidequest_attempt::Column::AttemptedAt.gte(v)))
                    .add_option(before.map(|v| sidequest_attempt::Column::AttemptedAt.lte(v))),
            )
            .order_by_desc(sidequest_attempt::Column::AttemptedAt)
    }
}

/// Best results of one user in one sidequest. Whether `max_result` or `min_result`
/// is the best one depends on `sidequest.is_higher_result_better`.
#[derive(FromQueryResult, Debug, Clone)]
pub struct SidequestBestResult {
    pub sidequest_id: Uuid,
    pub user_id: Uuid,
    pub max_result: f64,
    pub min_result: f64,
}

pub struct SidequestAttemptRepository;

impl SidequestAttemptRepository {
    pub async fn fetch_all_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
        after: Option<NaiveDateTime>,
        before: Option<NaiveDateTime>,
    ) -> RepositoryResult<Vec<sidequest_attempt::Model>> {
        sidequest_attempt::Entity::find_in_interval(after, before)
            .inner_join(sidequest::Entity)
            .filter(sidequest::Column::EventId.eq(event_id))
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_best_results_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<SidequestBestResult>> {
        sidequest_attempt::Entity::find()
            .select_only()
            .column(sidequest_attempt::Column::SidequestId)
            .column(sidequest_attempt::Column::UserId)
            .column_as(sidequest_attempt::Column::Result.max(), "max_result")
            .column_as(sidequest_attempt::Column::Result.min(), "min_result")
            .join(
                JoinType::InnerJoin,
                sidequest_attempt::Relation::Sidequest.def(),
            )
            .filter(sidequest::Column::EventId.eq(event_id))
            .group_by(sidequest_attempt::Column::SidequestId)
            .group_by(sidequest_attempt::Column::UserId)
            .into_model::<SidequestBestResult>()
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_all_by_sidequest_id<C: ConnectionTrait>(
        db: &C,
        sidequest_id: Uuid,
        after: Option<NaiveDateTime>,
        before: Option<NaiveDateTime>,
    ) -> RepositoryResult<Vec<sidequest_attempt::Model>> {
        sidequest_attempt::Entity::find_in_interval(after, before)
            .filter(sidequest_attempt::Column::SidequestId.eq(sidequest_id))
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_all_by_team_id<C: ConnectionTrait>(
        db: &C,
        team_id: Uuid,
        after: Option<NaiveDateTime>,
        before: Option<NaiveDateTime>,
    ) -> RepositoryResult<Vec<sidequest_attempt::Model>> {
        sidequest_attempt::Entity::find_in_interval(after, before)
            .inner_join(user::Entity)
            .join(
                JoinType::InnerJoin,
                user::Relation::TeamRoleAssignment.def(),
            )
            .filter(team_role_assignment::Column::TeamId.eq(team_id))
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_all_by_event_user_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
        user_id: Uuid,
        after: Option<NaiveDateTime>,
        before: Option<NaiveDateTime>,
    ) -> RepositoryResult<Vec<sidequest_attempt::Model>> {
        sidequest_attempt::Entity::find_in_interval(after, before)
            .inner_join(sidequest::Entity)
            .filter(
                Condition::all()
                    .add(sidequest::Column::EventId.eq(event_id))
                    .add(sidequest_attempt::Column::UserId.eq(user_id)),
            )
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_by_id<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<sidequest_attempt::Model> {
        sidequest_attempt::Entity::find_by_id(id)
            .one(db)
            .await?
            .or_fail(sidequest_attempt::Entity.table_name(), id)
    }

    #[expect(
        clippy::missing_panics_doc,
        reason = "the foreign key constraints guarantee the event exists"
    )]
    pub async fn fetch_by_id_with_event<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<(sidequest_attempt::Model, event::Model)> {
        let (sidequest_attempt, event) = sidequest_attempt::Entity::find_by_id(id)
            .join(
                JoinType::InnerJoin,
                sidequest_attempt::Relation::Sidequest.def(),
            )
            .join(JoinType::InnerJoin, sidequest::Relation::Event.def())
            .select_also(event::Entity)
            .one(db)
            .await?
            .or_fail(sidequest_attempt::Entity.table_name(), id)?;

        let event = event.expect("Foreign key constraints ensure event exists");

        Ok((sidequest_attempt, event))
    }

    pub async fn fetch_latest_by_event_user_id_opt<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
        user_id: Uuid,
    ) -> RepositoryResult<Option<sidequest_attempt::Model>> {
        sidequest_attempt::Entity::find()
            .inner_join(sidequest::Entity)
            .filter(
                Condition::all()
                    .add(sidequest::Column::EventId.eq(event_id))
                    .add(sidequest_attempt::Column::UserId.eq(user_id)),
            )
            .order_by_desc(sidequest_attempt::Column::AttemptedAt)
            .one(db)
            .await
            .map_err(RepositoryError::from)
    }
}
