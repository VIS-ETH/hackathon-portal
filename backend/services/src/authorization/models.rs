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
    pub event: EventRolesMap,
    pub team: TeamRolesMap,
}

impl UserRoles {
    #[must_use]
    pub const fn new(event: EventRolesMap, team: TeamRolesMap) -> Self {
        Self { event, team }
    }

    #[must_use]
    pub fn get_event_roles(&self, event_id: &Uuid) -> EventRoles {
        self.event.get(event_id).cloned().unwrap_or_default()
    }

    #[must_use]
    pub fn get_team_roles(&self, team_id: &Uuid) -> TeamRoles {
        self.team.get(team_id).cloned().unwrap_or_default()
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema, FromQueryResult)]
pub struct AffiliateRow<R: TryGetable> {
    pub id: Uuid,
    pub name: String,
    pub index: i32,
    pub role: R,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventAffiliate {
    pub id: Uuid,
    pub name: String,
    pub roles: Vec<EventRole>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamAffiliate {
    pub id: Uuid,
    pub name: String,
    pub roles: Vec<TeamRole>,
}
