use serde::Deserialize;

use crate::entity::team as DbTeam;

#[derive(Clone, Deserialize, utoipa :: ToSchema)]
pub struct CreateUser{
    pub auth_id: String,
    pub name: String,
}

pub struct UserWithTeam{
    pub id: String,
    pub auth_id : String,
    pub name : String,
    pub group : Option<DbTeam::Model>
}