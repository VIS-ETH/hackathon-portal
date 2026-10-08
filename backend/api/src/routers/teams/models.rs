use hackathon_portal_services::authorization::groups::Groups;
use hackathon_portal_services::event::models::Event as EventBO;
use hackathon_portal_services::infrastructure::models::IngressConfig;
use hackathon_portal_services::ranking::models::TeamRanking;
use hackathon_portal_services::team::models::Team as TeamBO;
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct TeamIdQuery {
    /// Filter by team id
    pub team_id: Uuid,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Team {
    pub id: Uuid,
    pub event_id: Uuid,
    pub project_id: Option<Uuid>,
    pub name: String,
    pub slug: String,
    pub index: i32,
    pub photo_url: Option<String>,
    pub managed_address: Option<String>,
    pub direct_address: Option<String>,
    pub private_address: Option<String>,
    pub ssh_config: Option<String>,
    pub ingress_enabled: bool,
    pub ingress_config: IngressConfig,
    pub ingress_url: Option<String>,
    pub finalist: Option<bool>,
    /// The public repository with the code of the team, visible like the blog.
    pub repository_url: Option<String>,
}

/// Which restricted fields of a team the user may view, all others are redacted.
#[derive(Debug, Clone, Copy, Default)]
pub struct TeamViewPermissions {
    pub project_assignment: bool,
    pub finalists: bool,
    pub repository: bool,
}

impl TeamViewPermissions {
    /// The groups must include the user's roles on the team, since its affiliates may view
    /// the repository like the blog.
    #[must_use]
    pub fn new(groups: &Groups, event: &EventBO) -> Self {
        Self {
            project_assignment: groups.can_view_project_assignment(
                event.visibility,
                event.projects_visible,
                event.project_assignments_visible,
            ),
            finalists: groups.can_view_finalists(event.visibility, event.finalists_visible),
            repository: groups.can_view_team_blog(event.visibility, event.phase),
        }
    }
}

impl From<(TeamBO, TeamViewPermissions)> for Team {
    fn from(value: (TeamBO, TeamViewPermissions)) -> Self {
        let (team, permissions) = value;

        let project_id = if permissions.project_assignment {
            team.project_id
        } else {
            None
        };

        let finalist = if permissions.finalists {
            Some(team.finalist)
        } else {
            None
        };

        let repository_url = if permissions.repository {
            team.repository_url
        } else {
            None
        };

        Self {
            id: team.id,
            event_id: team.event_id,
            project_id,
            name: team.name,
            slug: team.slug,
            index: team.index,
            photo_url: team.photo_url,
            managed_address: team.managed_address,
            direct_address: team.direct_address,
            private_address: team.private_address,
            ssh_config: team.ssh_config,
            ingress_enabled: team.ingress_enabled,
            ingress_config: team.ingress_config,
            ingress_url: team.ingress_url,
            finalist,
            repository_url,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct AdminTeam {
    pub id: Uuid,
    pub event_id: Uuid,
    pub project_id: Option<Uuid>,
    pub name: String,
    pub slug: String,
    pub index: i32,
    pub photo_url: Option<String>,
    pub extra_score: Option<f64>,
    pub comment: Option<String>,
    pub managed_address: Option<String>,
    pub managed_address_override: Option<String>,
    pub direct_address: Option<String>,
    pub direct_address_override: Option<String>,
    pub private_address: Option<String>,
    pub private_address_override: Option<String>,
    pub ssh_config: Option<String>,
    pub ssh_config_override: Option<String>,
    pub ingress_enabled: bool,
    pub ingress_config: IngressConfig,
    pub ingress_url: Option<String>,
    pub finalist: bool,
    pub repository_url: Option<String>,
}

impl From<TeamBO> for AdminTeam {
    fn from(value: TeamBO) -> Self {
        Self {
            id: value.id,
            event_id: value.event_id,
            project_id: value.project_id,
            name: value.name,
            slug: value.slug,
            index: value.index,
            photo_url: value.photo_url,
            extra_score: value.extra_score,
            comment: value.comment,
            managed_address: value.managed_address,
            managed_address_override: value.managed_address_override,
            direct_address: value.direct_address,
            direct_address_override: value.direct_address_override,
            private_address: value.private_address,
            private_address_override: value.private_address_override,
            ssh_config: value.ssh_config,
            ssh_config_override: value.ssh_config_override,
            ingress_enabled: value.ingress_enabled,
            ingress_config: value.ingress_config,
            ingress_url: value.ingress_url,
            finalist: value.finalist,
            repository_url: value.repository_url,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct CreateTeamAPIKey {
    pub budget: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamRankingView {
    pub max_total_points: f64,
    pub team: TeamRanking,
}
