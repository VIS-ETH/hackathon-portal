use crate::authorization::groups::{Group, Groups};
use repositories::db::prelude::EventPhase;
use repositories::db::sea_orm_active_enums::EventVisibility;

impl Groups {
    #[must_use]
    pub fn can_view_event(&self, event_visibility: EventVisibility) -> bool {
        if self >= &Group::EventStaff {
            return true;
        }

        if self >= &Group::EventAffiliate {
            return event_visibility != EventVisibility::Hidden;
        }

        event_visibility == EventVisibility::Public
    }

    #[must_use]
    pub fn can_view_event_internal(&self, event_visibility: EventVisibility) -> bool {
        if let Some(decision) = self.default_can_view_policy(event_visibility) {
            return decision;
        }

        self >= &Group::EventAffiliate
    }

    #[must_use]
    pub fn can_manage_event(&self) -> bool {
        self >= &Group::EventAdmin
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

        if self >= &Group::EventParticipant {
            return event_phase == EventPhase::Registration;
        }

        false
    }

    #[must_use]
    pub fn can_view_team_confidential(&self, event_visibility: EventVisibility) -> bool {
        if let Some(decision) = self.default_can_view_policy(event_visibility) {
            return decision;
        }

        self >= &Group::TeamMember
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

        if self >= &Group::TeamMember {
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

        if self >= &Group::EventStakeholder {
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

        if self >= &Group::EventSidequestMaster {
            return event_phase == EventPhase::Registration;
        }

        false
    }

    #[must_use]
    pub fn can_view_sidequest_attempt(&self, event_visibility: EventVisibility) -> bool {
        if let Some(decision) = self.default_can_view_policy(event_visibility) {
            return decision;
        }

        self >= &Group::EventSidequestMaster
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

        if self >= &Group::EventSidequestMaster {
            return event_phase == EventPhase::Hacking;
        }

        false
    }

    fn default_can_view_policy(&self, event_visibility: EventVisibility) -> Option<bool> {
        if self >= &Group::EventAdmin {
            return Some(true);
        }

        if !self.can_view_event(event_visibility) {
            return Some(false);
        }

        None
    }

    fn default_can_manage_policy(
        &self,
        event_visibility: EventVisibility,
        event_is_ro: bool,
    ) -> Option<bool> {
        if self >= &Group::EventAdmin {
            return Some(true);
        }

        if !self.can_view_event(event_visibility) {
            return Some(false);
        }

        if !(self >= &Group::EventAffiliate) {
            return Some(false);
        }

        if event_is_ro {
            return Some(false);
        }

        None
    }
}
