use sea_orm::FromQueryResult;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct UserForCreate {
    pub auth_id: String,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct UserForPatch {
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema, FromQueryResult)]
pub struct UserWithGroup {
    pub user_name: String,
    pub group_name: String,
}
