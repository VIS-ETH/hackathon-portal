use crate::user::fmt_user_name;
use hackathon_portal_repositories::db::prelude::*;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct User {
    pub id: Uuid,
    pub auth_id: String,
    pub name: String,
}

impl From<db_user::Model> for User {
    fn from(value: db_user::Model) -> Self {
        Self {
            id: value.id,
            auth_id: value.auth_id,
            name: fmt_user_name(&value.name, value.index),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct ReducedUser {
    pub id: Uuid,
    pub name: String,
}

impl From<User> for ReducedUser {
    fn from(value: User) -> Self {
        Self {
            id: value.id,
            name: value.name,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct UserForCreate {
    pub auth_id: String,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct UserForUpdate {}
