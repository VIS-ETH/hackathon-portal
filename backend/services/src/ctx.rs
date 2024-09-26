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

pub trait ServiceCtx: Send + Sync {
    fn user(&self) -> &User;

    fn event_roles(&self, event_id: Uuid) -> HashSet<EventRole> {
        match self.user() {
            User::Service => vec![
                EventRole::Admin,
                EventRole::Mentor,
                EventRole::Participant,
                EventRole::SidequestMaster,
                EventRole::Stakeholder,
            ]
            .into_iter()
            .collect(),
            User::Regular { events_roles, .. } => {
                events_roles.get(&event_id).cloned().unwrap_or_default()
            }
        }
    }

    fn team_roles(&self, team_id: Uuid) -> HashSet<TeamRole> {
        match self.user() {
            User::Service => vec![TeamRole::Mentor, TeamRole::Member]
                .into_iter()
                .collect(),
            User::Regular { teams_roles, .. } => {
                teams_roles.get(&team_id).cloned().unwrap_or_default()
            }
        }
    }
}
