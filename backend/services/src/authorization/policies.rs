use crate::authorization::groups::Groups;
use crate::event::models::Event;
use hackathon_portal_repositories::db::{EventPhase, EventVisibility};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, ToSchema)]
pub struct Policies {
    pub can_view_event: bool,
    pub can_view_event_internal: bool,
    pub can_manage_event: bool,
    pub can_create_team: bool,
    pub can_view_team_confidential: bool,
    pub can_view_team_feedback: bool,
    pub can_update_team_name: bool,
    pub can_update_team_photo: bool,
    pub can_update_team_ingress_config: bool,
    pub can_view_team_blog: bool,
    pub can_update_team_blog: bool,
    pub can_manage_team: bool,
    pub can_manage_jury_rating: bool,
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

/// The event properties that policies depend on.
#[derive(Debug, Clone, Copy)]
pub struct EventFlags {
    pub visibility: EventVisibility,
    pub phase: EventPhase,
    pub read_only: bool,
    pub projects_visible: bool,
    pub project_assignments_visible: bool,
    pub feedback_visible: bool,
    pub vote_enabled: bool,
    pub finalists_visible: bool,
}

impl From<&Event> for EventFlags {
    fn from(event: &Event) -> Self {
        Self {
            visibility: event.visibility,
            phase: event.phase,
            read_only: event.read_only,
            projects_visible: event.projects_visible,
            project_assignments_visible: event.project_assignments_visible,
            feedback_visible: event.feedback_visible,
            vote_enabled: event.vote_enabled,
            finalists_visible: event.finalists_visible,
        }
    }
}

impl Policies {
    #[must_use]
    pub fn new(groups: &Groups, event: EventFlags) -> Self {
        Self {
            can_view_event: groups.can_view_event(event.visibility),
            can_view_event_internal: groups.can_view_event_internal(event.visibility),
            can_manage_event: groups.can_manage_event(),
            can_create_team: groups.can_create_team(event.visibility, event.phase, event.read_only),
            can_view_team_confidential: groups.can_view_team_confidential(event.visibility),
            can_view_team_feedback: groups.can_view_team_feedback(
                event.visibility,
                event.phase,
                event.feedback_visible,
            ),
            can_update_team_name: groups.can_update_team_name(
                event.visibility,
                event.phase,
                event.read_only,
            ),
            can_update_team_photo: groups.can_update_team_photo(
                event.visibility,
                event.phase,
                event.read_only,
            ),
            can_update_team_ingress_config: groups.can_update_team_ingress_config(
                event.visibility,
                event.phase,
                event.read_only,
            ),
            can_view_team_blog: groups.can_view_team_blog(event.visibility, event.phase),
            can_update_team_blog: groups.can_update_team_blog(
                event.visibility,
                event.phase,
                event.read_only,
            ),
            can_manage_team: groups.can_manage_team(event.visibility, event.phase, event.read_only),
            can_manage_jury_rating: groups.can_manage_jury_rating(
                event.visibility,
                event.phase,
                event.read_only,
            ),
            can_view_project: groups.can_view_project(event.visibility, event.projects_visible),
            can_manage_project: groups.can_manage_project(
                event.visibility,
                event.phase,
                event.read_only,
            ),
            can_view_project_assignment: groups.can_view_project_assignment(
                event.visibility,
                event.projects_visible,
                event.project_assignments_visible,
            ),
            can_view_sidequest: groups.can_view_sidequest(event.visibility, event.phase),
            can_manage_sidequest: groups.can_manage_sidequest(event.visibility, event.read_only),
            can_view_sidequest_attempt: groups.can_view_sidequest_attempt(event.visibility),
            can_manage_sidequest_attempt: groups.can_manage_sidequest_attempt(
                event.visibility,
                event.phase,
                event.read_only,
            ),
            can_create_upload: groups.can_create_upload(
                event.visibility,
                event.phase,
                event.read_only,
            ),
            can_public_vote: groups.can_public_vote(
                event.visibility,
                event.vote_enabled,
                event.read_only,
            ),
            can_view_finalist: groups.can_view_finalists(event.visibility, event.finalists_visible),
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
    #[expect(
        clippy::print_stdout,
        reason = "dumps the policy matrix, inspect with --nocapture"
    )]
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
                EventFlags {
                    visibility: *input.2,
                    phase: *input.3,
                    read_only: *input.4,
                    projects_visible: *input.5,
                    project_assignments_visible: *input.6,
                    feedback_visible: *input.7,
                    vote_enabled: *input.8,
                    finalists_visible: *input.9,
                },
            );

            println!("{idx}: {input:?} => {policies:?}");
        }
    }
}
