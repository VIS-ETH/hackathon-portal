use crate::authorization::groups::Groups;
use hackathon_portal_repositories::db::prelude::{EventPhase, EventRole, TeamRole};
use hackathon_portal_repositories::db::sea_orm_active_enums::EventVisibility;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, ToSchema)]
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

#[cfg(test)]
mod tests {
    use super::*;
    use itertools::{iproduct, Itertools};
    use strum::VariantArray;

    #[test]
    fn exhaustive_enumeration() {
        let event_roles = EventRole::VARIANTS.into_iter().powerset();
        let team_roles = TeamRole::VARIANTS.into_iter().powerset();
        let event_visibilities = EventVisibility::VARIANTS.into_iter();
        let event_phases = EventPhase::VARIANTS.into_iter();
        let event_is_ro = [true, false].iter();
        let event_feedback_is_visible = [true, false].iter();

        let inputs = iproduct!(
            event_roles,
            team_roles,
            event_visibilities,
            event_phases,
            event_is_ro,
            event_feedback_is_visible
        );

        for (idx, input) in inputs.enumerate() {
            let er = input.0.iter().map(|x| **x).collect::<Vec<_>>();
            let tr = input.1.iter().map(|x| **x).collect::<Vec<_>>();

            let policies = Policies::new(
                &Groups::from_roles(&er, &tr),
                *input.2,
                *input.3,
                *input.4,
                *input.5,
            );

            println!("{idx}: {:?} => {:?}", input, policies);
        }
    }
}
