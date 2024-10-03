pub mod models;

use crate::user::models::{User, UserForCreate, UserForUpdate};
use crate::ServiceResult;
use repositories::db::prelude::*;
use repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::{IntoActiveModel, QuerySelect, SelectColumns, Set, TransactionTrait};

#[derive(Clone)]
pub struct UserService {
    db_repo: DbRepository,
}

impl UserService {
    #[must_use]
    pub const fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn create_or_get_user(
        &self,
        auth_id: &str,
        name: Option<&str>,
    ) -> ServiceResult<User> {
        let user = self.db_repo.get_user_by_auth_id(auth_id).await.ok();

        if let Some(user) = user {
            if let Some(name) = name {
                if user.name != name {
                    return self.update_user_name(user.id, name).await;
                }
            }

            return Ok(user.into());
        }

        let active_user = db_user::ActiveModel {
            auth_id: Set(auth_id.to_string()),
            name: Set(auth_id.to_string()), // will be updated later
            index: Set(0),
            ..Default::default()
        };

        let user = active_user.insert(self.db_repo.conn()).await?;

        Ok(user.into())
    }

    pub async fn create_users(&self, users: Vec<UserForCreate>) -> ServiceResult<Vec<User>> {
        let mut new_users = Vec::new();

        for user in users {
            new_users.push(self.create_or_get_user(&user.auth_id, None).await?);
        }

        Ok(new_users)
    }

    pub async fn get_user(&self, user_id: Uuid) -> ServiceResult<User> {
        let user = self.db_repo.get_user(user_id).await?;
        Ok(user.into())
    }

    pub async fn update_user(&self, user_id: Uuid, _user_fu: UserForUpdate) -> ServiceResult<User> {
        let user = self.db_repo.get_user(user_id).await?;
        let active_user = user.into_active_model();

        // Currently useless

        let user = active_user.update(self.db_repo.conn()).await?;

        Ok(user.into())
    }

    pub async fn update_user_name(&self, user_id: Uuid, name: &str) -> ServiceResult<User> {
        let user = self.db_repo.get_user(user_id).await?;
        let txn = self.db_repo.conn().begin().await?;

        let index = db_user::Entity::find()
            .select_only()
            .select_column_as(db_user::Column::Index.max(), "index")
            .filter(db_user::Column::Name.eq(name))
            .group_by(db_user::Column::Name)
            .into_tuple::<i32>()
            .one(&txn)
            .await?;

        let mut active_user = user.into_active_model();
        active_user.name = Set(name.to_string());
        active_user.index = Set(index.map_or(0, |i| i + 1));

        let user = active_user.update(&txn).await?;
        txn.commit().await?;

        Ok(user.into())
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
