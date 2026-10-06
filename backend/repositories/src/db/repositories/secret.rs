use crate::db::generated::sea_orm_active_enums::SecretScope;
use crate::db::generated::{secret, team_secret, user_secret};
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::{JoinType, QueryOrder, QuerySelect};

pub struct SecretRepository;

impl SecretRepository {
    pub async fn fetch_by_id<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<secret::Model> {
        secret::Entity::find_by_id(id)
            .one(db)
            .await?
            .or_fail(secret::Entity.table_name(), id)
    }

    pub async fn fetch_by_name_opt<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
        scope: SecretScope,
        name: &str,
    ) -> RepositoryResult<Option<secret::Model>> {
        secret::Entity::find()
            .filter(secret::Column::EventId.eq(event_id))
            .filter(secret::Column::Scope.eq(scope))
            .filter(secret::Column::Name.eq(name))
            .one(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_all_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<secret::Model>> {
        secret::Entity::find()
            .filter(secret::Column::EventId.eq(event_id))
            .order_by_asc(secret::Column::Name)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_all_team_values_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<team_secret::Model>> {
        team_secret::Entity::find()
            .join(JoinType::InnerJoin, team_secret::Relation::Secret.def())
            .filter(secret::Column::EventId.eq(event_id))
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_all_user_values_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<user_secret::Model>> {
        user_secret::Entity::find()
            .join(JoinType::InnerJoin, user_secret::Relation::Secret.def())
            .filter(secret::Column::EventId.eq(event_id))
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    /// Returns the values of the secret keyed by team id.
    pub async fn fetch_all_team_values_by_secret_id<C: ConnectionTrait>(
        db: &C,
        secret_id: Uuid,
    ) -> RepositoryResult<Vec<(Uuid, Vec<u8>)>> {
        team_secret::Entity::find()
            .filter(team_secret::Column::SecretId.eq(secret_id))
            .select_only()
            .column(team_secret::Column::TeamId)
            .column(team_secret::Column::Value)
            .into_tuple()
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    /// Returns the values of the secret keyed by user id.
    pub async fn fetch_all_user_values_by_secret_id<C: ConnectionTrait>(
        db: &C,
        secret_id: Uuid,
    ) -> RepositoryResult<Vec<(Uuid, Vec<u8>)>> {
        user_secret::Entity::find()
            .filter(user_secret::Column::SecretId.eq(secret_id))
            .select_only()
            .column(user_secret::Column::UserId)
            .column(user_secret::Column::Value)
            .into_tuple()
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    /// Returns the values of the team together with the names of their secrets, ordered by name.
    pub async fn fetch_all_named_values_by_team_id<C: ConnectionTrait>(
        db: &C,
        team_id: Uuid,
    ) -> RepositoryResult<Vec<(String, Vec<u8>)>> {
        team_secret::Entity::find()
            .join(JoinType::InnerJoin, team_secret::Relation::Secret.def())
            .filter(team_secret::Column::TeamId.eq(team_id))
            .order_by_asc(secret::Column::Name)
            .select_only()
            .column(secret::Column::Name)
            .column(team_secret::Column::Value)
            .into_tuple()
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    /// Returns the values of the user in the event together with the names of their secrets,
    /// ordered by name.
    pub async fn fetch_all_named_values_by_event_id_and_user_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
        user_id: Uuid,
    ) -> RepositoryResult<Vec<(String, Vec<u8>)>> {
        user_secret::Entity::find()
            .join(JoinType::InnerJoin, user_secret::Relation::Secret.def())
            .filter(secret::Column::EventId.eq(event_id))
            .filter(user_secret::Column::UserId.eq(user_id))
            .order_by_asc(secret::Column::Name)
            .select_only()
            .column(secret::Column::Name)
            .column(user_secret::Column::Value)
            .into_tuple()
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }
}
