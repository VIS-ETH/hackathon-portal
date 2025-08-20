use crate::authorization::models::UserRoles;
use hackathon_portal_repositories::db::prelude::{EventPhase, EventRole, TeamRole};
use hackathon_portal_repositories::db::sea_orm_active_enums::EventVisibility;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use strum::{Display, VariantArray};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(
    Serialize, Deserialize, Display, Debug, Clone, Copy, Eq, PartialEq, VariantArray, ToSchema, Hash,
)]
pub enum Group {
    // Event roles
    EventAdmin,
    EventMentor,
    EventParticipant,
    EventSidequestMaster,
    EventStakeholder,
    EventStaff,
    EventAffiliate,
    EventGuest,
    // Team roles
    TeamMember,
    TeamMentor,
    TeamAffiliate,
    // Other roles
    ExpertRater,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Groups(pub HashSet<Group>);

impl Groups {
    #[must_use]
    pub const fn new(groups: HashSet<Group>) -> Self {
        Self(groups)
    }

    #[must_use]
    pub fn from_roles(event_roles: &[EventRole], team_roles: &[TeamRole]) -> Self {
        let mut groups = HashSet::new();

        for event_role in event_roles {
            let role_groups = Self::from(*event_role);
            groups.extend(role_groups.0);
        }

        for team_role in team_roles {
            let role_groups = Self::from(*team_role);
            groups.extend(role_groups.0);
        }

        Self::new(groups)
    }

    #[must_use]
    pub fn from_event(roles: &UserRoles, event_id: Uuid) -> Self {
        let event_roles = roles.get_event_roles(&event_id);

        Self::from_roles(&event_roles.into_iter().collect::<Vec<_>>(), &[])
    }

    #[must_use]
    pub fn from_event_and_team(roles: &UserRoles, event_id: Uuid, team_id: Uuid) -> Self {
        let event_roles = roles.get_event_roles(&event_id);
        let team_roles = roles.get_team_roles(&team_id);

        Self::from_roles(
            &event_roles.into_iter().collect::<Vec<_>>(),
            &team_roles.into_iter().collect::<Vec<_>>(),
        )
    }
}

impl From<EventRole> for Groups {
    fn from(value: EventRole) -> Self {
        const ADMIN_GROUPS: &[Group] = &[
            Group::EventAdmin,
            Group::EventMentor,
            Group::EventParticipant,
            Group::EventSidequestMaster,
            Group::EventStakeholder,
            Group::EventStaff,
            Group::EventAffiliate,
            Group::EventGuest,
            Group::TeamMember,
            Group::TeamMentor,
            Group::TeamAffiliate,
            Group::ExpertRater,
        ];

        const MENTOR_GROUPS: &[Group] = &[
            Group::EventMentor,
            Group::EventStaff,
            Group::EventAffiliate,
            Group::EventGuest,
            Group::ExpertRater,
        ];

        const PARTICIPANT_GROUPS: &[Group] = &[
            Group::EventParticipant,
            Group::EventAffiliate,
            Group::EventGuest,
        ];

        const SIDEQUEST_MASTER_GROUPS: &[Group] = &[
            Group::EventSidequestMaster,
            Group::EventStaff,
            Group::EventAffiliate,
            Group::EventGuest,
        ];

        const STAKEHOLDER_GROUPS: &[Group] = &[
            Group::EventStakeholder,
            Group::EventStaff,
            Group::EventAffiliate,
            Group::EventGuest,
            Group::ExpertRater,
        ];

        let groups = match value {
            EventRole::Admin => ADMIN_GROUPS,
            EventRole::Mentor => MENTOR_GROUPS,
            EventRole::Participant => PARTICIPANT_GROUPS,
            EventRole::SidequestMaster => SIDEQUEST_MASTER_GROUPS,
            EventRole::Stakeholder => STAKEHOLDER_GROUPS,
        };

        Self::new(groups.iter().copied().collect())
    }
}

impl From<TeamRole> for Groups {
    fn from(value: TeamRole) -> Self {
        const MEMBER_GROUPS: &[Group] = &[Group::TeamMember, Group::TeamAffiliate];

        const MENTOR_GROUPS: &[Group] = &[Group::TeamMentor, Group::TeamAffiliate];

        let groups = match value {
            TeamRole::Member => MEMBER_GROUPS,
            TeamRole::Mentor => MENTOR_GROUPS,
        };

        Self::new(groups.iter().copied().collect())
    }
}

impl PartialEq<Group> for Groups {
    fn eq(&self, other: &Group) -> bool {
        self.0.contains(other)
    }
}

impl Groups {
    #[must_use]
    pub fn can_view_event(&self, event_visibility: EventVisibility) -> bool {
        if self == &Group::EventStaff {
            return true;
        }

        if self == &Group::EventAffiliate {
            return event_visibility != EventVisibility::Hidden;
        }

        event_visibility == EventVisibility::Public
    }

    #[must_use]
    pub fn can_view_event_internal(&self, event_visibility: EventVisibility) -> bool {
        if let Some(decision) = self.default_can_view_policy(event_visibility) {
            return decision;
        }

        self == &Group::EventAffiliate
    }

    #[must_use]
    pub fn can_view_event_feedback(
        &self,
        event_visibility: EventVisibility,
        event_phase: EventPhase,
        event_feedback_is_visible: bool,
    ) -> bool {
        if let Some(decision) = self.default_can_view_policy(event_visibility) {
            return decision;
        }

        if self.can_view_event_internal(event_visibility) {
            return event_phase == EventPhase::Finished && event_feedback_is_visible;
        }

        false
    }

    #[must_use]
    pub fn can_manage_event(&self) -> bool {
        self == &Group::EventAdmin
    }

    #[must_use]
    pub fn can_create_team(
        &self,
        event_visibility: EventVisibility,
        event_phase: EventPhase,
        event_is_ro: bool,
    ) -> bool {
        if let Some(decision) = self.default_can_manage_policy(event_visibility, event_is_ro) {
            return decision;
        }

        if self == &Group::EventParticipant {
            return event_phase == EventPhase::Registration;
        }

        false
    }

    #[must_use]
    pub fn can_manage_expert_rating(
        &self,
        event_visibility: EventVisibility,
        event_phase: EventPhase,
        event_is_ro: bool,
    ) -> bool {
        if let Some(decision) = self.default_can_manage_policy(event_visibility, event_is_ro) {
            return decision;
        }

        if self == &Group::ExpertRater {
            return event_phase == EventPhase::Grading;
        }

        false
    }

    #[must_use]
    pub fn can_view_team_confidential(&self, event_visibility: EventVisibility) -> bool {
        if let Some(decision) = self.default_can_view_policy(event_visibility) {
            return decision;
        }

        self == &Group::TeamMember
    }

    #[must_use]
    pub fn can_view_team_feedback(
        &self,
        event_visibility: EventVisibility,
        event_phase: EventPhase,
        event_feedback_is_visible: bool,
    ) -> bool {
        if let Some(decision) = self.default_can_view_policy(event_visibility) {
            return decision;
        }

        if self == &Group::TeamAffiliate {
            return event_phase == EventPhase::Finished && event_feedback_is_visible;
        }

        false
    }

    #[must_use]
    pub fn can_manage_team(
        &self,
        event_visibility: EventVisibility,
        event_phase: EventPhase,
        event_is_ro: bool,
    ) -> bool {
        if let Some(decision) = self.default_can_manage_policy(event_visibility, event_is_ro) {
            return decision;
        }

        if self == &Group::TeamMember {
            return event_phase == EventPhase::Registration;
        }

        false
    }

    #[must_use]
    pub fn can_manage_project(
        &self,
        event_visibility: EventVisibility,
        event_phase: EventPhase,
        event_is_ro: bool,
    ) -> bool {
        if let Some(decision) = self.default_can_manage_policy(event_visibility, event_is_ro) {
            return decision;
        }

        if self == &Group::EventStakeholder {
            return event_phase == EventPhase::Registration;
        }

        false
    }

    #[must_use]
    pub fn can_manage_sidequest(
        &self,
        event_visibility: EventVisibility,
        event_phase: EventPhase,
        event_is_ro: bool,
    ) -> bool {
        if let Some(decision) = self.default_can_manage_policy(event_visibility, event_is_ro) {
            return decision;
        }

        if self == &Group::EventSidequestMaster {
            return event_phase == EventPhase::Registration;
        }

        false
    }

    #[must_use]
    pub fn can_view_sidequest_attempt(&self, event_visibility: EventVisibility) -> bool {
        if let Some(decision) = self.default_can_view_policy(event_visibility) {
            return decision;
        }

        self == &Group::EventSidequestMaster
    }

    #[must_use]
    pub fn can_manage_sidequest_attempt(
        &self,
        event_visibility: EventVisibility,
        event_phase: EventPhase,
        event_is_ro: bool,
    ) -> bool {
        if let Some(decision) = self.default_can_manage_policy(event_visibility, event_is_ro) {
            return decision;
        }

        if self == &Group::EventSidequestMaster {
            return event_phase == EventPhase::Hacking;
        }

        false
    }

    /// - Some(true) iff the groups definitely grant viewing permissions
    /// - Some(false) iff the groups definitely deny viewing permissions
    /// - None iff the groups do not have a definite answer
    fn default_can_view_policy(&self, event_visibility: EventVisibility) -> Option<bool> {
        if self == &Group::EventAdmin {
            return Some(true);
        }

        if !self.can_view_event(event_visibility) {
            return Some(false);
        }

        None
    }

    /// - Some(true) iff the groups definitely grant management permissions
    /// - Some(false) iff the groups definitely deny management permissions
    /// - None iff the groups do not have a definite answer
    fn default_can_manage_policy(
        &self,
        event_visibility: EventVisibility,
        event_is_ro: bool,
    ) -> Option<bool> {
        if self == &Group::EventAdmin {
            return Some(true);
        }

        if !self.can_view_event(event_visibility) {
            return Some(false);
        }

        if !(self == &Group::EventAffiliate) {
            return Some(false);
        }

        if event_is_ro {
            return Some(false);
        }

        None
    }
}
