pub mod model;

use crate::ctx::{Ctx, User};
use crate::event::model::{CreateEventRequest, CreateEventResponse, GetEventsResponse};
use repositories::db::prelude::*;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, QueryOrder, Set, TransactionTrait};

use crate::ServiceResult;
use repositories::db::prelude::{db_event, EventPhase};
use repositories::DbRepository;

#[derive(Clone)]
pub struct UserService {
    db_repo: DbRepository,
}

impl UserService {
    pub fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn get_or_create(&self, auth_id: &str) -> ServiceResult<db_user::Model> {
        let user = db_user::Entity::find()
            .filter(db_user::Column::AuthId.eq(auth_id))
            .one(self.db_repo.conn())
            .await?;

        if let Some(user) = user {
            return Ok(user);
        }

        let name = auth_id.split('@').next().unwrap_or("Unknown");

        let active_user = db_user::ActiveModel {
            auth_id: Set(auth_id.to_string()),
            name: Set(name.to_string()),
            ..Default::default()
        };

        let user = db_user::Entity::insert(active_user)
            .exec_with_returning(self.db_repo.conn())
            .await?;

        Ok(user)
    }
}
