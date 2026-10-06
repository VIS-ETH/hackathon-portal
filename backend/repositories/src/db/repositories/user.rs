use crate::db::generated::sea_orm_active_enums::EventRole;
use crate::db::generated::{event_role_assignment, user};
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::{Condition, FromQueryResult, QuerySelect};

/// A user of an event together with one of their event roles.
#[derive(FromQueryResult, Debug, Clone)]
pub struct EventUserRow {
    pub id: Uuid,
    pub auth_id: String,
    pub name: String,
    pub index: i32,
    pub role: EventRole,
}

pub struct UserRepository;

impl UserRepository {
    pub async fn fetch_by_id<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<user::Model> {
        user::Entity::find_by_id(id)
            .one(db)
            .await?
            .or_fail(user::Entity.table_name(), id)
    }

    pub async fn fetch_by_auth_id_opt<C: ConnectionTrait>(
        db: &C,
        auth_id: &str,
    ) -> RepositoryResult<Option<user::Model>> {
        user::Entity::find()
            .filter(user::Column::AuthId.eq(auth_id))
            .one(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_all_by_auth_ids<C: ConnectionTrait>(
        db: &C,
        auth_ids: &[String],
    ) -> RepositoryResult<Vec<user::Model>> {
        user::Entity::find()
            .filter(user::Column::AuthId.is_in(auth_ids.iter().map(String::as_str)))
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    /// Returns one row per role assignment, so users with several roles appear several times.
    pub async fn fetch_all_with_event_roles_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<EventUserRow>> {
        user::Entity::find()
            .inner_join(event_role_assignment::Entity)
            .filter(event_role_assignment::Column::EventId.eq(event_id))
            .select_only()
            .column(user::Column::Id)
            .column(user::Column::AuthId)
            .column(user::Column::Name)
            .column(user::Column::Index)
            .column(event_role_assignment::Column::Role)
            .into_model::<EventUserRow>()
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    /// Sets `last_seen_at` to `now`, unless it's already later than `stale_before`.
    ///
    /// The condition is part of the update, so concurrent callers don't write more than once.
    pub async fn touch_last_seen<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
        now: DateTime,
        stale_before: DateTime,
    ) -> RepositoryResult<()> {
        user::Entity::update_many()
            .col_expr(user::Column::LastSeenAt, Expr::value(now))
            .filter(user::Column::Id.eq(id))
            .filter(
                Condition::any()
                    .add(user::Column::LastSeenAt.is_null())
                    .add(user::Column::LastSeenAt.lt(stale_before)),
            )
            .exec(db)
            .await
            .map_err(RepositoryError::from)?;

        Ok(())
    }
}
