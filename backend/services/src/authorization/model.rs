use repositories::db::prelude::{EventRole, TeamRole};
use sea_orm::{FromQueryResult, TryGetable};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use utoipa::ToSchema;
use uuid::Uuid;

pub type ResourceRoles<T> = HashSet<T>;
pub type ResourceRolesMap<T> = HashMap<Uuid, HashSet<T>>;
pub type EventRoles = ResourceRoles<EventRole>;
pub type EventRolesMap = ResourceRolesMap<EventRole>;

pub type TeamRoles = ResourceRoles<TeamRole>;
pub type TeamRolesMap = ResourceRolesMap<TeamRole>;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct UserRoles {
    pub event: HashMap<Uuid, HashSet<EventRole>>,
    pub team: HashMap<Uuid, HashSet<TeamRole>>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema, FromQueryResult)]
pub struct AffiliateRow<R: TryGetable> {
    pub id: Uuid,
    pub name: String,
    pub role: R,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamAffiliate {
    pub id: Uuid,
    pub name: String,
    pub roles: Vec<TeamRole>,
}
