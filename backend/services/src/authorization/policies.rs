use crate::authorization::groups::{Group, Groups};
use repositories::db::prelude::EventPhase;
use repositories::db::sea_orm_active_enums::EventVisibility;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Policies {
    pub can_view_event: bool,
    pub can_view_event_internal: bool,
    pub can_view_event_feedback: bool,
    pub can_manage_event: bool,
    pub can_create_team: bool,
    pub can_view_team_confidential: bool,
    pub can_view_team_feedback: bool,
    pub can_manage_team: bool,
    pub can_manage_expert_rating: bool,
    pub can_manage_project: bool,
    pub can_manage_sidequest: bool,
    pub can_view_sidequest_attempt: bool,
    pub can_manage_sidequest_attempt: bool,
}

impl Policies {
    #[must_use]
    pub fn new(
        groups: &Groups,
        event_visibility: EventVisibility,
        event_phase: EventPhase,
        event_is_ro: bool,
        event_feedback_is_visible: bool,
    ) -> Self {
        Self {
            can_view_event: groups.can_view_event(event_visibility),
            can_view_event_internal: groups.can_view_event_internal(event_visibility),
            can_view_event_feedback: groups.can_view_event_feedback(
                event_visibility,
                event_phase,
                event_feedback_is_visible,
            ),
            can_manage_event: groups.can_manage_event(),
            can_create_team: groups.can_create_team(event_visibility, event_phase, event_is_ro),
            can_view_team_confidential: groups.can_view_team_confidential(event_visibility),
            can_view_team_feedback: groups.can_view_team_feedback(
                event_visibility,
                event_phase,
                event_feedback_is_visible,
            ),
            can_manage_team: groups.can_manage_team(event_visibility, event_phase, event_is_ro),
            can_manage_expert_rating: groups.can_manage_expert_rating(
                event_visibility,
                event_phase,
                event_is_ro,
            ),
            can_manage_project: groups.can_manage_project(
                event_visibility,
                event_phase,
                event_is_ro,
            ),
            can_manage_sidequest: groups.can_manage_sidequest(
                event_visibility,
                event_phase,
                event_is_ro,
            ),
            can_view_sidequest_attempt: groups.can_view_sidequest_attempt(event_visibility),
            can_manage_sidequest_attempt: groups.can_manage_sidequest_attempt(
                event_visibility,
                event_phase,
                event_is_ro,
            ),
        }
    }
}

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
    pub fn can_manage_expert_rating(
        &self,
        event_visibility: EventVisibility,
        event_phase: EventPhase,
        event_is_ro: bool,
    ) -> bool {
        if let Some(decision) = self.default_can_manage_policy(event_visibility, event_is_ro) {
            return decision;
        }

        if self >= &Group::ExpertRater {
            return event_phase == EventPhase::Grading;
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
    pub fn can_view_team_feedback(
        &self,
        event_visibility: EventVisibility,
        event_phase: EventPhase,
        event_feedback_is_visible: bool,
    ) -> bool {
        if let Some(decision) = self.default_can_view_policy(event_visibility) {
            return decision;
        }

        if self >= &Group::TeamAffiliate {
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
