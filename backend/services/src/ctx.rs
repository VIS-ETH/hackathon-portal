use repositories::db::prelude::*;
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub enum User {
    Service,
    Regular {
        user: db_user::Model,
        events_roles: HashMap<Uuid, HashSet<EventRole>>,
        teams_roles: HashMap<Uuid, HashSet<TeamRole>>,
    },
}

impl User {
    pub fn events_roles(&self) -> HashMap<Uuid, HashSet<EventRole>> {
        match self {
            User::Service => Default::default(),
            User::Regular { events_roles, .. } => events_roles.clone(),
        }
    }

    pub fn event_roles(&self, event_id: Uuid) -> HashSet<EventRole> {
        match self {
            User::Service => Default::default(),
            User::Regular { events_roles, .. } => {
                events_roles.get(&event_id).cloned().unwrap_or_default()
            }
        }
    }

    pub fn teams_roles(&self) -> HashMap<Uuid, HashSet<TeamRole>> {
        match self {
            User::Service => Default::default(),
            User::Regular { teams_roles, .. } => teams_roles.clone(),
        }
    }

    pub fn team_roles(&self, team_id: Uuid) -> HashSet<TeamRole> {
        match self {
            User::Service => Default::default(),
            User::Regular { teams_roles, .. } => {
                teams_roles.get(&team_id).cloned().unwrap_or_default()
            }
        }
    }
}

pub trait ServiceCtx: Send + Sync {
    fn user(&self) -> &User;
}
