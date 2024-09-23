use crate::appState::AppState;
use crate::entity::user as DbUser;
use crate::entity::team as DbTeam;
use crate::error::{BackendResult, BackendError};
use crate::api::schema::user::{CreateUser, UserWithTeam};
use sea_orm::prelude::Uuid;
use sea_orm::EntityOrSelect;
use sea_orm::QueryFilter;
use sea_orm::{ActiveModelTrait, ConnectionTrait, DeleteResult, EntityTrait, ModelTrait, Set};


pub async fn get_user_by_id(trx: &impl ConnectionTrait, id : Uuid) -> BackendResult<DbUser::Model> {
    let user = DbUser::Entity::find_by_id(id).one(trx).await?;
    match user {
        None => return Err(BackendError::NotFound { entity: format!("user with id {}", id)}),
        Some(user) => return Ok(user),
    }
}


pub async fn get_all_users(trx: &impl ConnectionTrait) -> BackendResult<Vec<DbUser::Model>> {
    let users = DbUser::Entity::find().all(trx).await?;
    Ok(users)
}


pub async fn add_user(trx : &impl ConnectionTrait, user : CreateUser) -> BackendResult<DbUser::Model> {

    let active_user = DbUser::ActiveModel{
        auth_id : Set(user.auth_id),
        name : Set(user.name),
        ..Default::default()
    };

    let user_created = active_user.insert(trx).await;

    match user_created {
        Err(error) => return Err(BackendError::DBError(error)),
        Ok(user) => return Ok(user),
    }
}

pub async fn add_users(trx : &impl ConnectionTrait, users : Vec<CreateUser>) -> BackendResult<Vec<DbUser::Model>> {
    let active_users = users.into_iter().map(|user|  {
        DbUser::ActiveModel {
            auth_id : Set(user.auth_id),
            name: Set(user.name),
            ..Default::default()
        }
    }).collect::<Vec<_>>();

    let mut result = Vec::<DbUser::Model>::new();
    for active_user in active_users {
        let user_created = active_user.insert(trx).await;
        match user_created {
            Err(error) => return Err(BackendError::DBError(error)),
            Ok(user) => result.push(user),
        }
    }
    Ok(result)
}

pub async fn delete_user(trx: &impl ConnectionTrait, id : Uuid) -> BackendResult<DeleteResult> {
    let user = get_user_by_id(trx, id).await?;
    let result = user.delete(trx).await?;
    Ok(result)    
}

