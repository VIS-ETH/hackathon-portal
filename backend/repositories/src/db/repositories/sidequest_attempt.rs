use crate::db::generated::{sidequest, sidequest_attempt, team_role_assignment, user};
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::sqlx::types::chrono::NaiveDateTime;
use sea_orm::{Condition, JoinType, QueryOrder, QuerySelect};

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
