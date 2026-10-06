pub mod models;

use crate::user::models::{User, UserForCreate, UserForUpdate};
use crate::ServiceResult;
use chrono::{NaiveDateTime, TimeDelta, Utc};
use hackathon_portal_repositories::db::{
    db_event_user_discord_id, db_user, EventUserRepository, OrFailExt, UserRepository,
};
use hackathon_portal_repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::sea_query::OnConflict;
use sea_orm::{
    Condition, DatabaseTransaction, DbBackend, IntoActiveModel, QuerySelect, SelectColumns, Set,
    Statement, TransactionTrait,
};
use std::collections::HashMap;
use tracing::warn;

/// Minimum time between two `last_seen_at` writes of the same user.
const LAST_SEEN_INTERVAL: TimeDelta = TimeDelta::minutes(5);

#[derive(Clone)]
pub struct UserService {
    db_repo: DbRepository,
}

impl UserService {
    #[must_use]
    pub const fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    /// Resolves the user of an authenticated request and records it as their latest activity.
    pub async fn create_or_get_user(&self, user: UserForCreate) -> ServiceResult<User> {
        let existing =
            UserRepository::fetch_by_auth_id_opt(self.db_repo.conn(), &user.auth_id).await?;

        let last_seen_at = existing.as_ref().and_then(|e| e.last_seen_at);

        if let Some(existing) = existing {
            if user.name.as_ref().is_none_or(|name| *name == existing.name) {
                self.touch_last_seen_if_stale(existing.id, last_seen_at);
                return Ok(existing.into());
            }
        }

        let result = self
            .create_or_get_users(std::slice::from_ref(&user))
            .await?
            .pop()
            .or_fail(db_user::Entity.table_name(), &user.auth_id)?;

        self.touch_last_seen_if_stale(result.id, last_seen_at);

        Ok(result)
    }

    /// Updates `last_seen_at` in the background if it's older than [`LAST_SEEN_INTERVAL`].
    /// Failures are only logged, so they never affect the request.
    fn touch_last_seen_if_stale(&self, user_id: Uuid, last_seen_at: Option<NaiveDateTime>) {
        let now = Utc::now().naive_utc();
        let stale_before = now - LAST_SEEN_INTERVAL;

        if last_seen_at.is_some_and(|t| t >= stale_before) {
            return;
        }

        let db_repo = self.db_repo.clone();

        tokio::spawn(async move {
            if let Err(e) =
                UserRepository::touch_last_seen(db_repo.conn(), user_id, now, stale_before).await
            {
                warn!(user = %user_id, error = ?e, "Failed to update last seen");
            }
        });
    }

    pub async fn create_or_get_users(&self, users: &[UserForCreate]) -> ServiceResult<Vec<User>> {
        if users.is_empty() {
            return Ok(Vec::new());
        }

        let auth_ids = users.iter().map(|u| u.auth_id.clone()).collect::<Vec<_>>();
        let auth_id_to_name = users
            .iter()
            .filter_map(|u| Some((u.auth_id.as_str(), u.name.as_deref()?)))
            .collect::<HashMap<_, _>>();

        let active_users = auth_ids.iter().map(|auth_id| db_user::ActiveModel {
            auth_id: Set(auth_id.clone()),
            // we don't know the name yet, so we use auth_id as a placeholder
            name: Set(auth_id.clone()),
            index: Set(0),
            ..Default::default()
        });

        let txn = self.db_repo.conn().begin().await?;

        db_user::Entity::insert_many(active_users)
            .on_conflict(
                OnConflict::column(db_user::Column::AuthId)
                    .do_nothing()
                    .to_owned(),
            )
            .on_empty_do_nothing()
            .exec_without_returning(&txn)
            .await?;

        let models = UserRepository::fetch_all_by_auth_ids(&txn, &auth_ids).await?;

        let mut result = Vec::with_capacity(models.len());

        for model in models {
            match auth_id_to_name.get(model.auth_id.as_str()) {
                Some(&name) if name != model.name => {
                    result.push(Self::rename_user(&txn, model, name).await?);
                }
                _ => result.push(model.into()),
            }
        }

        txn.commit().await?;

        Ok(result)
    }

    pub async fn get_user(&self, user_id: Uuid) -> ServiceResult<User> {
        let user = UserRepository::fetch_by_id(self.db_repo.conn(), user_id).await?;
        Ok(user.into())
    }

    pub async fn update_user(&self, user_id: Uuid, _user_fu: UserForUpdate) -> ServiceResult<User> {
        let user = UserRepository::fetch_by_id(self.db_repo.conn(), user_id).await?;
        let active_user = user.into_active_model();

        // Currently useless

        let user = active_user.update(self.db_repo.conn()).await?;

        Ok(user.into())
    }

    /// Renames the user. If the name is already taken, the index will be set accordingly.
    async fn rename_user(
        txn: &DatabaseTransaction,
        user: db_user::Model,
        name: &str,
    ) -> ServiceResult<User> {
        // Serialize renames to the same name until the transaction ends,
        // so concurrent ones don't compute the same index
        txn.execute(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "SELECT pg_advisory_xact_lock(hashtext($1))",
            [name.into()],
        ))
        .await?;

        let index = db_user::Entity::find()
            .select_only()
            .select_column_as(db_user::Column::Index.max(), "index")
            .filter(
                Condition::all()
                    .add(db_user::Column::Name.eq(name))
                    .add(db_user::Column::Id.ne(user.id)),
            )
            .group_by(db_user::Column::Name)
            .into_tuple::<i32>()
            .one(txn)
            .await?;

        let mut active_user = user.into_active_model();
        active_user.name = Set(name.to_string());
        active_user.index = Set(index.map_or(0, |i| i + 1));

        let user = active_user.update(txn).await?;

        Ok(user.into())
    }

    pub async fn get_event_discord_id(
        &self,
        user_id: Uuid,
        event_id: Uuid,
    ) -> ServiceResult<Option<String>> {
        let event_user =
            EventUserRepository::fetch_by_id_opt(self.db_repo.conn(), event_id, user_id).await?;

        Ok(event_user.map(|e| e.discord_id))
    }

    /// Links the user's Discord ID to their user account for a specific event.
    pub async fn update_discord_id(
        &self,
        user_id: Uuid,
        event_id: Uuid,
        discord_id: String,
    ) -> ServiceResult<()> {
        let existing =
            EventUserRepository::fetch_by_id_opt(self.db_repo.conn(), event_id, user_id).await?;

        if let Some(existing) = existing {
            // Update existing record
            let mut active = existing.into_active_model();
            active.discord_id = Set(discord_id);
            active.update(self.db_repo.conn()).await?;
        } else {
            // Insert new record
            let new = db_event_user_discord_id::ActiveModel {
                user_id: Set(user_id),
                event_id: Set(event_id),
                discord_id: Set(discord_id),
            };
            new.insert(self.db_repo.conn()).await?;
        }

        Ok(())
    }
}

#[must_use]
pub fn fmt_user_name(name: &str, index: i32) -> String {
    if index == 0 {
        name.to_string()
    } else {
        format!("{name} ({index})")
    }
}
