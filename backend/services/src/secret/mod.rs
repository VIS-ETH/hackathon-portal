pub mod models;

use crate::crypto::CryptoService;
use crate::secret::models::{
    EventSecrets, Secret, SecretForCreate, SecretForUpdate, SecretSubject, SecretValue,
};
use crate::team::fmt_team_index;
use crate::user::fmt_user_name;
use crate::{ServiceError, ServiceResult};
use hackathon_portal_repositories::db::{
    db_secret, db_team_secret, db_user_secret, EventRoleAssignmentRepository, OrFailExt,
    SecretRepository, SecretScope, TeamRepository, UserRepository,
};
use hackathon_portal_repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::sea_query::OnConflict;
use sea_orm::{
    ActiveModelTrait, IntoActiveModel, QuerySelect, QueryTrait, Set, TransactionTrait,
    TryInsertResult,
};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

#[derive(Clone)]
pub struct SecretService {
    crypto_service: Arc<CryptoService>,
    db_repo: DbRepository,
}

impl SecretService {
    #[must_use]
    pub const fn new(crypto_service: Arc<CryptoService>, db_repo: DbRepository) -> Self {
        Self {
            crypto_service,
            db_repo,
        }
    }

    /// All secrets of the event with their values, together with all teams and users of the
    /// event the values can be distributed to.
    pub async fn get_event_secrets(&self, event_id: Uuid) -> ServiceResult<EventSecrets> {
        let conn = self.db_repo.conn();

        let mut values = HashMap::<Uuid, HashMap<Uuid, String>>::new();

        for value in SecretRepository::fetch_all_team_values_by_event_id(conn, event_id).await? {
            values
                .entry(value.secret_id)
                .or_default()
                .insert(value.team_id, self.crypto_service.decrypt(&value.value)?);
        }

        for value in SecretRepository::fetch_all_user_values_by_event_id(conn, event_id).await? {
            values
                .entry(value.secret_id)
                .or_default()
                .insert(value.user_id, self.crypto_service.decrypt(&value.value)?);
        }

        let secrets = SecretRepository::fetch_all_by_event_id(conn, event_id)
            .await?
            .into_iter()
            .map(|secret| {
                let values = values.remove(&secret.id).unwrap_or_default();
                assemble_secret(secret, values)
            })
            .collect();

        let teams = TeamRepository::fetch_all_by_event_id(conn, event_id)
            .await?
            .into_iter()
            .map(|team| SecretSubject {
                id: team.id,
                key: team_key(team.index),
                index: Some(team.index),
                label: team.name,
                roles: Vec::new(),
            })
            .collect();

        let users = self.get_user_subjects(event_id).await?;

        Ok(EventSecrets {
            secrets,
            teams,
            users,
        })
    }

    pub async fn get_secret(&self, secret_id: Uuid) -> ServiceResult<Secret> {
        let conn = self.db_repo.conn();
        let secret = SecretRepository::fetch_by_id(conn, secret_id).await?;

        let encrypted_values = match secret.scope {
            SecretScope::Team => {
                SecretRepository::fetch_all_team_values_by_secret_id(conn, secret_id).await?
            }
            SecretScope::User => {
                SecretRepository::fetch_all_user_values_by_secret_id(conn, secret_id).await?
            }
        };

        let values = encrypted_values
            .into_iter()
            .map(|(subject_id, value)| Ok((subject_id, self.crypto_service.decrypt(&value)?)))
            .collect::<ServiceResult<_>>()?;

        Ok(assemble_secret(secret, values))
    }

    /// The event of the secret, without loading its values.
    pub async fn get_secret_event_id(&self, secret_id: Uuid) -> ServiceResult<Uuid> {
        let secret = SecretRepository::fetch_by_id(self.db_repo.conn(), secret_id).await?;

        Ok(secret.event_id)
    }

    pub async fn create_secret(&self, secret_fc: SecretForCreate) -> ServiceResult<Secret> {
        let SecretForCreate {
            event_id,
            scope,
            name,
        } = secret_fc;
        let name = name.trim();

        if name.is_empty() {
            return Err(ServiceError::Parsing {
                message: "The name of a secret must not be empty".to_string(),
            });
        }

        let secret = insert_secret_opt(self.db_repo.conn(), event_id, scope, name)
            .await?
            .ok_or_else(|| ServiceError::SecretNameNotUnique {
                name: name.to_string(),
            })?;

        Ok(assemble_secret(secret, HashMap::new()))
    }

    pub async fn update_secret(
        &self,
        secret_id: Uuid,
        secret_fu: SecretForUpdate,
    ) -> ServiceResult<Secret> {
        let conn = self.db_repo.conn();
        let mut secret = SecretRepository::fetch_by_id(conn, secret_id)
            .await?
            .into_active_model();

        // Not trimmed: leading indents and trailing hard breaks are Markdown.
        let description = secret_fu.description;
        secret.description = Set((!description.trim().is_empty()).then_some(description));

        let secret = secret.update(conn).await?;

        Ok(assemble_secret(secret, HashMap::new()))
    }

    /// Cascade deletes the values of the secret.
    pub async fn delete_secret(&self, secret_id: Uuid) -> ServiceResult<()> {
        db_secret::Entity::delete_by_id(secret_id)
            .exec(self.db_repo.conn())
            .await?;

        Ok(())
    }

    /// Sets the values of the given teams or users, depending on the scope of the secret.
    /// An empty value removes the value. All teams or users must belong to the event of the
    /// secret, otherwise nothing is changed.
    pub async fn update_secret_values(
        &self,
        secret_id: Uuid,
        values: HashMap<Uuid, String>,
    ) -> ServiceResult<Secret> {
        let txn = self.db_repo.conn().begin().await?;

        let secret = SecretRepository::fetch_by_id(&txn, secret_id).await?;
        self.write_secret_values(&txn, &secret, values).await?;

        txn.commit().await?;

        self.get_secret(secret_id).await
    }

    /// Sets the value of the team for the team secret with the given name, which is created
    /// if it does not exist yet.
    pub async fn set_team_secret(
        &self,
        event_id: Uuid,
        team_id: Uuid,
        name: &str,
        value: String,
    ) -> ServiceResult<()> {
        let txn = self.db_repo.conn().begin().await?;

        // Values may be set for several teams concurrently, so the secret may have been
        // created in the meantime.
        let secret = match insert_secret_opt(&txn, event_id, SecretScope::Team, name).await? {
            Some(secret) => secret,
            None => SecretRepository::fetch_by_name_opt(&txn, event_id, SecretScope::Team, name)
                .await?
                .or_fail(db_secret::Entity.table_name(), name)?,
        };

        self.write_secret_values(&txn, &secret, HashMap::from([(team_id, value)]))
            .await?;

        txn.commit().await?;

        Ok(())
    }

    /// Validates and writes the values of [`Self::update_secret_values`].
    async fn write_secret_values<C: ConnectionTrait>(
        &self,
        db: &C,
        secret: &db_secret::Model,
        values: HashMap<Uuid, String>,
    ) -> ServiceResult<()> {
        let subject_ids = values.keys().copied().collect::<Vec<_>>();

        let valid_ids = match secret.scope {
            SecretScope::Team => {
                TeamRepository::fetch_ids_by_event_id_and_ids(db, secret.event_id, &subject_ids)
                    .await?
                    .into_iter()
                    .collect::<HashSet<_>>()
            }
            SecretScope::User => EventRoleAssignmentRepository::fetch_all_by_event_id_and_user_ids(
                db,
                secret.event_id,
                &subject_ids,
            )
            .await?
            .into_iter()
            .map(|assignment| assignment.user_id)
            .collect::<HashSet<_>>(),
        };

        if let Some(id) = subject_ids.iter().find(|id| !valid_ids.contains(id)) {
            return Err(ServiceError::SecretSubjectNotInEvent {
                scope: secret.scope,
                id: *id,
            });
        }

        let (cleared, set): (Vec<_>, Vec<_>) =
            values.into_iter().partition(|(_, value)| value.is_empty());

        let cleared = cleared.into_iter().map(|(id, _)| id).collect::<Vec<_>>();

        let set = set
            .into_iter()
            .map(|(id, value)| Ok((id, self.crypto_service.encrypt(&value)?)))
            .collect::<ServiceResult<Vec<_>>>()?;

        match secret.scope {
            SecretScope::Team => {
                if !cleared.is_empty() {
                    db_team_secret::Entity::delete_many()
                        .filter(db_team_secret::Column::SecretId.eq(secret.id))
                        .filter(db_team_secret::Column::TeamId.is_in(cleared))
                        .exec(db)
                        .await?;
                }

                db_team_secret::Entity::insert_many(set.into_iter().map(|(team_id, value)| {
                    db_team_secret::ActiveModel {
                        secret_id: Set(secret.id),
                        team_id: Set(team_id),
                        value: Set(value),
                    }
                }))
                .on_conflict(
                    OnConflict::columns([
                        db_team_secret::Column::SecretId,
                        db_team_secret::Column::TeamId,
                    ])
                    .update_column(db_team_secret::Column::Value)
                    .to_owned(),
                )
                .on_empty_do_nothing()
                .exec_without_returning(db)
                .await?;
            }
            SecretScope::User => {
                if !cleared.is_empty() {
                    db_user_secret::Entity::delete_many()
                        .filter(db_user_secret::Column::SecretId.eq(secret.id))
                        .filter(db_user_secret::Column::UserId.is_in(cleared))
                        .exec(db)
                        .await?;
                }

                db_user_secret::Entity::insert_many(set.into_iter().map(|(user_id, value)| {
                    db_user_secret::ActiveModel {
                        secret_id: Set(secret.id),
                        user_id: Set(user_id),
                        value: Set(value),
                    }
                }))
                .on_conflict(
                    OnConflict::columns([
                        db_user_secret::Column::SecretId,
                        db_user_secret::Column::UserId,
                    ])
                    .update_column(db_user_secret::Column::Value)
                    .to_owned(),
                )
                .on_empty_do_nothing()
                .exec_without_returning(db)
                .await?;
            }
        }

        Ok(())
    }

    /// Deletes the values of the given users for all user secrets of the event.
    pub async fn delete_user_secrets<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
        user_ids: &[Uuid],
    ) -> ServiceResult<()> {
        if user_ids.is_empty() {
            return Ok(());
        }

        db_user_secret::Entity::delete_many()
            .filter(db_user_secret::Column::UserId.is_in(user_ids.iter().copied()))
            .filter(
                db_user_secret::Column::SecretId.in_subquery(
                    db_secret::Entity::find()
                        .select_only()
                        .column(db_secret::Column::Id)
                        .filter(db_secret::Column::EventId.eq(event_id))
                        .into_query(),
                ),
            )
            .exec(db)
            .await?;

        Ok(())
    }

    pub async fn get_team_secrets(&self, team_id: Uuid) -> ServiceResult<Vec<SecretValue>> {
        let values =
            SecretRepository::fetch_all_named_values_by_team_id(self.db_repo.conn(), team_id)
                .await?;

        self.decrypt_named_values(values)
    }

    pub async fn get_user_secrets(
        &self,
        event_id: Uuid,
        user_id: Uuid,
    ) -> ServiceResult<Vec<SecretValue>> {
        let values = SecretRepository::fetch_all_named_values_by_event_id_and_user_id(
            self.db_repo.conn(),
            event_id,
            user_id,
        )
        .await?;

        self.decrypt_named_values(values)
    }

    async fn get_user_subjects(&self, event_id: Uuid) -> ServiceResult<Vec<SecretSubject>> {
        let rows =
            UserRepository::fetch_all_with_event_roles_by_event_id(self.db_repo.conn(), event_id)
                .await?;

        let mut users = rows
            .into_iter()
            .fold(
                HashMap::new(),
                |mut acc: HashMap<Uuid, SecretSubject>, row| {
                    acc.entry(row.id)
                        .or_insert_with(|| SecretSubject {
                            id: row.id,
                            key: row.auth_id,
                            index: None,
                            label: fmt_user_name(&row.name, row.index),
                            roles: Vec::new(),
                        })
                        .roles
                        .push(row.role);

                    acc
                },
            )
            .into_values()
            .collect::<Vec<_>>();

        users.sort_by(|a, b| a.label.cmp(&b.label));

        Ok(users)
    }

    fn decrypt_named_values(
        &self,
        values: Vec<(String, Option<String>, Vec<u8>)>,
    ) -> ServiceResult<Vec<SecretValue>> {
        values
            .into_iter()
            .map(|(name, description, value)| {
                Ok(SecretValue {
                    name,
                    description,
                    value: self.crypto_service.decrypt(&value)?,
                })
            })
            .collect()
    }
}

/// Inserts the secret, or returns `None` if the event already has a secret with this scope and name.
async fn insert_secret_opt<C: ConnectionTrait>(
    db: &C,
    event_id: Uuid,
    scope: SecretScope,
    name: &str,
) -> ServiceResult<Option<db_secret::Model>> {
    let result = db_secret::Entity::insert(db_secret::ActiveModel {
        event_id: Set(event_id),
        scope: Set(scope),
        name: Set(name.to_string()),
        ..Default::default()
    })
    .on_conflict(
        OnConflict::columns([
            db_secret::Column::EventId,
            db_secret::Column::Scope,
            db_secret::Column::Name,
        ])
        .do_nothing()
        .to_owned(),
    )
    .do_nothing()
    // `exec_with_returning` reports a conflict as `RecordNotFound` instead of `Conflicted`.
    .exec(db)
    .await?;

    match result {
        TryInsertResult::Inserted(result) => Ok(Some(db_secret::Model {
            id: result.last_insert_id,
            event_id,
            scope,
            name: name.to_string(),
            description: None,
        })),
        TryInsertResult::Conflicted | TryInsertResult::Empty => Ok(None),
    }
}

fn assemble_secret(secret: db_secret::Model, values: HashMap<Uuid, String>) -> Secret {
    Secret {
        id: secret.id,
        event_id: secret.event_id,
        scope: secret.scope,
        name: secret.name,
        description: secret.description,
        values,
    }
}

/// The key of a team in imports, matching the `{team_index_padded}` template of the team addresses.
fn team_key(index: i32) -> String {
    format!("team-{}", fmt_team_index(index))
}
