use crate::authorization::models::UserRoles;
use repositories::db::prelude::{EventRole, TeamRole};
use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use strum::{Display, VariantArray};
use utoipa::ToSchema;
use uuid::Uuid;

/**
A group is a power set of roles and has a partial order relation defined on it.
This allows for easy permissions testing, e.g. to ensure that a resource is only accessed
by a user that either is an event admin, event mentor, event sidequest master, or event stakeholder,
we can simply write `user_groups >= Group::EventStaff`.

Here is the corresponding Hasse diagram for the group:

```graphviz
graph {
  layout = dot
  rankdir = TB
  node [ shape="none" ]

    EventAdmin [label="EventAdmin"]
    EventMentor [label="EventMentor"]
    EventParticipant [label="EventParticipant"]
    EventSidequestMaster [label="EventSidequestMaster"]
    EventStakeholder [label="EventStakeholder"]
    TeamMember [label="TeamMember"]
    TeamMentor [label="TeamMentor"]
    EventStaff [label="EventStaff"]
    TeamAffiliate [label="TeamAffiliate"]
    EventAffiliate [label="EventAffiliate"]
    ExpertRater [label="ExpertRater"]
    EventGuest [label="EventGuest"]

    { rank=same; EventSidequestMaster, EventStakeholder, EventMentor }

    EventAdmin -- {EventStakeholder, TeamMentor, TeamMember, EventSidequestMaster}
    ExpertRater -- {EventStaff}
    {TeamMember, TeamMentor} -- TeamAffiliate
    TeamMentor -- EventMentor
    {EventMentor, EventStakeholder} -- ExpertRater
    EventSidequestMaster -- EventStaff
    TeamAffiliate -- EventAffiliate
    {EventParticipant, EventStaff} -- EventAffiliate
    TeamMember -- EventParticipant
    EventAffiliate -- EventGuest
}
```
**/
#[derive(
    Serialize, Deserialize, Display, Debug, Clone, Copy, Eq, PartialEq, VariantArray, ToSchema,
)]
pub enum Group {
    // Event roles
    EventAdmin,
    EventMentor,
    EventParticipant,
    EventSidequestMaster,
    EventStakeholder,
    // Team roles
    TeamMember,
    TeamMentor,
    // Power sets
    EventStaff,
    TeamAffiliate,
    EventAffiliate,
    EventGuest,
    // Rating
    ExpertRater,
}

impl From<EventRole> for Group {
    fn from(value: EventRole) -> Self {
        match value {
            EventRole::Admin => Self::EventAdmin,
            EventRole::Mentor => Self::EventMentor,
            EventRole::Participant => Self::EventParticipant,
            EventRole::SidequestMaster => Self::EventSidequestMaster,
            EventRole::Stakeholder => Self::EventStakeholder,
        }
    }
}

impl From<TeamRole> for Group {
    fn from(value: TeamRole) -> Self {
        match value {
            TeamRole::Member => Self::TeamMember,
            TeamRole::Mentor => Self::TeamMentor,
        }
    }
}

impl PartialOrd for Group {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        match self {
            Self::EventAdmin => match other {
                Self::EventAdmin => Some(Ordering::Equal),

                Self::EventMentor
                | Self::EventParticipant
                | Self::EventSidequestMaster
                | Self::EventStakeholder
                | Self::TeamMember
                | Self::TeamMentor
                | Self::EventGuest
                | Self::EventAffiliate
                | Self::EventStaff
                | Self::TeamAffiliate
                | Self::ExpertRater => Some(Ordering::Greater),
            },
            Self::EventMentor => match other {
                Self::EventAdmin | Self::TeamMentor => Some(Ordering::Less),

                Self::EventMentor => Some(Ordering::Equal),

                Self::EventGuest | Self::EventAffiliate | Self::EventStaff | Self::ExpertRater => {
                    Some(Ordering::Greater)
                }

                _ => None,
            },
            Self::EventParticipant => match other {
                Self::EventAdmin | Self::TeamMember => Some(Ordering::Less),

                Self::EventParticipant => Some(Ordering::Equal),

                Self::EventAffiliate | Self::EventGuest => Some(Ordering::Greater),

                _ => None,
            },
            Self::EventSidequestMaster => match other {
                Self::EventAdmin => Some(Ordering::Less),

                Self::EventSidequestMaster => Some(Ordering::Equal),

                Self::EventStaff | Self::EventAffiliate | Self::EventGuest => {
                    Some(Ordering::Greater)
                }

                _ => None,
            },
            Self::EventStakeholder => match other {
                Self::EventAdmin => Some(Ordering::Less),

                Self::EventStakeholder => Some(Ordering::Equal),

                Self::EventStaff | Self::EventAffiliate | Self::EventGuest | Self::ExpertRater => {
                    Some(Ordering::Greater)
                }
                _ => None,
            },
            Self::TeamMember => match other {
                Self::EventAdmin => Some(Ordering::Less),

                Self::TeamMember => Some(Ordering::Equal),

                Self::EventParticipant
                | Self::TeamAffiliate
                | Self::EventAffiliate
                | Self::EventGuest => Some(Ordering::Greater),

                _ => None,
            },
            Self::TeamMentor => match other {
                Self::EventAdmin => Some(Ordering::Less),

                Self::TeamMentor => Some(Ordering::Equal),

                Self::EventMentor
                | Self::EventStaff
                | Self::EventAffiliate
                | Self::EventGuest
                | Self::TeamAffiliate
                | Self::ExpertRater => Some(Ordering::Greater),

                _ => None,
            },
            Self::EventStaff => match other {
                Self::EventAdmin
                | Self::EventMentor
                | Self::EventSidequestMaster
                | Self::EventStakeholder
                | Self::TeamMentor
                | Self::ExpertRater => Some(Ordering::Less),

                Self::EventStaff => Some(Ordering::Equal),

                Self::EventGuest | Self::EventAffiliate => Some(Ordering::Greater),

                _ => None,
            },
            Self::TeamAffiliate => match other {
                Self::EventAdmin | Self::TeamMember | Self::TeamMentor => Some(Ordering::Less),

                Self::TeamAffiliate => Some(Ordering::Equal),

                Self::EventAffiliate | Self::EventGuest => Some(Ordering::Greater),

                _ => None,
            },
            Self::EventAffiliate => match other {
                Self::EventAdmin
                | Self::EventMentor
                | Self::EventParticipant
                | Self::EventSidequestMaster
                | Self::EventStakeholder
                | Self::TeamMember
                | Self::TeamMentor
                | Self::EventStaff
                | Self::TeamAffiliate
                | Self::ExpertRater => Some(Ordering::Less),

                Self::EventAffiliate => Some(Ordering::Equal),

                Self::EventGuest => Some(Ordering::Greater),
            },
            Self::EventGuest => match other {
                Self::EventAdmin
                | Self::EventMentor
                | Self::EventParticipant
                | Self::EventSidequestMaster
                | Self::EventStakeholder
                | Self::TeamMember
                | Self::TeamMentor
                | Self::EventAffiliate
                | Self::EventStaff
                | Self::TeamAffiliate
                | Self::ExpertRater => Some(Ordering::Less),

                Self::EventGuest => Some(Ordering::Equal),
            },
            Self::ExpertRater => match other {
                Self::EventAdmin
                | Self::TeamMentor
                | Self::EventMentor
                | Self::EventStakeholder => Some(Ordering::Less),

                Self::ExpertRater => Some(Ordering::Equal),

                Self::EventStaff | Self::EventAffiliate | Self::EventGuest => {
                    Some(Ordering::Greater)
                }

                _ => None,
            },
        }
    }
}

impl PartialEq<Group> for Groups {
    fn eq(&self, other: &Group) -> bool {
        self.groups.iter().all(|group| group == other)
    }
}

impl PartialOrd<Group> for Groups {
    fn partial_cmp(&self, _: &Group) -> Option<Ordering> {
        // Only support comparisons of the form `[Group] >= Group`
        None
    }

    fn ge(&self, other: &Group) -> bool {
        self.groups.iter().any(|group| group >= other)
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Groups {
    groups: Vec<Group>,
}

impl Groups {
    #[must_use]
    pub fn new(groups: Vec<Group>) -> Self {
        Self { groups }
    }

    #[must_use]
    pub fn from_roles(roles: &UserRoles, event_id: Option<Uuid>, team_id: Option<Uuid>) -> Self {
        let mut groups = Vec::new();

        if let Some(event_id) = event_id {
            for event_role in roles.get_event_roles(&event_id) {
                groups.push(event_role.into());
            }
        }

        if let Some(team_id) = team_id {
            for team_role in roles.get_team_roles(&team_id) {
                groups.push(team_role.into());
            }
        }

        if groups.is_empty() {
            groups.push(Group::EventGuest);
        }

        Self::new(groups)
    }

    #[must_use]
    pub fn from_event(roles: &UserRoles, event_id: Uuid) -> Self {
        Self::from_roles(roles, Some(event_id), None)
    }

    #[must_use]
    pub fn from_event_and_team(roles: &UserRoles, event_id: Uuid, team_id: Uuid) -> Self {
        Self::from_roles(roles, Some(event_id), Some(team_id))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fmt::Display;

    #[test]
    fn test_group_reflexivity() {
        for group in Group::VARIANTS {
            assert!(
                group <= group,
                "{}",
                display_reflexivity_error(group, false)
            );
            assert!(group >= group, "{}", display_reflexivity_error(group, true));
        }
    }

    #[test]
    fn test_group_transitivity() {
        for a in Group::VARIANTS {
            for b in Group::VARIANTS {
                for c in Group::VARIANTS {
                    if a <= b && b <= c {
                        assert!(a <= c, "{}", display_transitivity_error(&a, &b, &c, false));
                    }

                    if a >= b && b >= c {
                        assert!(a >= c, "{}", display_transitivity_error(&a, &b, &c, true));
                    }
                }
            }
        }
    }

    #[test]
    fn test_group_antisymmetry() {
        for a in Group::VARIANTS {
            for b in Group::VARIANTS {
                if a <= b && b <= a {
                    assert_eq!(a, b, "{}", display_antisymmetry_error(&a, &b, false));
                }

                if a >= b && b >= a {
                    assert_eq!(a, b, "{}", display_antisymmetry_error(&a, &b, true));
                }
            }
        }
    }

    #[test]
    fn misc_comparisons() {
        let non_admin_groups = Group::VARIANTS
            .iter()
            .filter(|group| **group != Group::EventAdmin)
            .copied()
            .collect::<Vec<_>>();

        let non_admin_groups = Groups::new(non_admin_groups);

        assert!(!(non_admin_groups >= Group::EventAdmin));

        assert!(Group::TeamMember >= Group::TeamAffiliate);
        assert!(Group::TeamMentor >= Group::TeamAffiliate);
        assert!(!(Group::TeamAffiliate >= Group::TeamMember));
        assert!(!(Group::TeamAffiliate >= Group::TeamMentor));
        assert!(!(Group::TeamMentor >= Group::TeamMember));
        assert!(!(Group::TeamMember >= Group::TeamMentor));
    }

    fn display_reflexivity_error<T: Display>(a: T, rev: bool) -> String {
        let cmp = if rev { ">=" } else { "<=" };
        format!("{a} !{cmp} {a}")
    }

    fn display_transitivity_error<T: Display>(a: T, b: T, c: T, rev: bool) -> String {
        let cmp = if rev { ">=" } else { "<=" };
        format!("{a} {cmp} {b} {cmp} {c} but {a} !{cmp} {c}")
    }

    fn display_antisymmetry_error<T: Display>(a: T, b: T, rev: bool) -> String {
        let cmp = if rev { ">=" } else { "<=" };
        format!("{a} {cmp} {b} and {b} {cmp} {a} but {a} != {b}")
    }
}
