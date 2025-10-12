use crate::authorization::groups::Groups;
use hackathon_portal_repositories::db::{EventPhase, EventVisibility};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, ToSchema)]
#[allow(clippy::struct_excessive_bools)]
pub struct Policies {
    pub can_view_event: bool,
    pub can_view_event_internal: bool,
    pub can_view_event_feedback: bool,
    pub can_manage_event: bool,
    pub can_create_team: bool,
    pub can_view_team_confidential: bool,
    pub can_view_team_feedback: bool,
    pub can_update_team_name: bool,
    pub can_update_team_photo: bool,
    pub can_update_team_ingress_config: bool,
    pub can_manage_team: bool,
    pub can_manage_expert_rating: bool,
    pub can_view_project: bool,
    pub can_manage_project: bool,
    pub can_view_project_assignment: bool,
    pub can_view_sidequest: bool,
    pub can_manage_sidequest: bool,
    pub can_view_sidequest_attempt: bool,
    pub can_manage_sidequest_attempt: bool,
    pub can_create_upload: bool,
    pub can_public_vote: bool,
    pub can_view_finalist: bool,
}

impl Policies {
    #[must_use]
    pub fn new(
        groups: &Groups,
        event_visibility: EventVisibility,
        event_phase: EventPhase,
        event_ro: bool,
        event_projects_visible: bool,
        event_project_assignments_visible: bool,
        event_feedback_visible: bool,
        event_vote_enabled: bool,
        event_finalists_visible: bool,
    ) -> Self {
        Self {
            can_view_event: groups.can_view_event(event_visibility),
            can_view_event_internal: groups.can_view_event_internal(event_visibility),
            can_view_event_feedback: groups.can_view_event_feedback(
                event_visibility,
                event_phase,
                event_feedback_visible,
            ),
            can_manage_event: groups.can_manage_event(),
            can_create_team: groups.can_create_team(event_visibility, event_phase, event_ro),
            can_view_team_confidential: groups.can_view_team_confidential(event_visibility),
            can_view_team_feedback: groups.can_view_team_feedback(
                event_visibility,
                event_phase,
                event_feedback_visible,
            ),
            can_update_team_name: groups.can_update_team_name(
                event_visibility,
                event_phase,
                event_ro,
            ),
            can_update_team_photo: groups.can_update_team_photo(
                event_visibility,
                event_phase,
                event_ro,
            ),
            can_update_team_ingress_config: groups.can_update_team_ingress_config(
                event_visibility,
                event_phase,
                event_ro,
            ),
            can_manage_team: groups.can_manage_team(event_visibility, event_phase, event_ro),
            can_manage_expert_rating: groups.can_manage_expert_rating(
                event_visibility,
                event_phase,
                event_ro,
            ),
            can_view_project: groups.can_view_project(event_visibility, event_projects_visible),
            can_manage_project: groups.can_manage_project(event_visibility, event_phase, event_ro),
            can_view_project_assignment: groups.can_view_project_assignment(
                event_visibility,
                event_projects_visible,
                event_project_assignments_visible,
            ),
            can_view_sidequest: groups.can_view_sidequest(event_visibility, event_phase),
            can_manage_sidequest: groups.can_manage_sidequest(event_visibility, event_ro),
            can_view_sidequest_attempt: groups.can_view_sidequest_attempt(event_visibility),
            can_manage_sidequest_attempt: groups.can_manage_sidequest_attempt(
                event_visibility,
                event_phase,
                event_ro,
            ),
            can_create_upload: groups.can_create_upload(event_visibility, event_phase, event_ro),
            can_public_vote: groups.can_public_vote(event_visibility, event_vote_enabled, event_ro),
            can_view_finalist: groups.can_view_finalists(event_visibility, event_finalists_visible),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use hackathon_portal_repositories::db::{EventRole, TeamRole};
    use itertools::{iproduct, Itertools};
    use strum::VariantArray;

    #[test]
    fn exhaustive_enumeration() {
        let event_roles = EventRole::VARIANTS.iter().powerset();
        let team_roles = TeamRole::VARIANTS.iter().powerset();
        let event_visibilities = EventVisibility::VARIANTS.iter();
        let event_phases = EventPhase::VARIANTS.iter();
        let event_is_ro = [true, false].iter();
        let event_projects_visible = [true, false].iter();
        let event_project_assignments_visible = [true, false].iter();
        let event_feedback_is_visible = [true, false].iter();
        let event_vote_enabled = [true, false].iter();
        let event_finalists_visible = [true, false].iter();

        let inputs = iproduct!(
            event_roles,
            team_roles,
            event_visibilities,
            event_phases,
            event_is_ro,
            event_projects_visible,
            event_project_assignments_visible,
            event_feedback_is_visible,
            event_vote_enabled,
            event_finalists_visible,
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
                *input.6,
                *input.7,
                *input.8,
                *input.9,
            );

            println!("{idx}: {input:?} => {policies:?}");
        }
    }
}
