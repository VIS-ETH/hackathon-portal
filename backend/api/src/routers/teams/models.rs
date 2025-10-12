use hackathon_portal_services::infrastructure::models::IngressConfig;
use hackathon_portal_services::team::models::Team as TeamBO;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamIdQuery {
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
}

impl From<(TeamBO, bool, bool)> for Team {
    fn from(value: (TeamBO, bool, bool)) -> Self {
        let (team, can_view_project_assignment, can_view_finalists) = value;

        let project_id = if can_view_project_assignment {
            team.project_id
        } else {
            None
        };

        let finalist = if can_view_finalists {
            Some(team.finalist)
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
            finalist: finalist,
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
    pub password: Option<String>,
    pub ai_api_key: Option<String>,
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
            password: value.password,
            ai_api_key: value.ai_api_key,
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
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamCredentials {
    pub vm_password: Option<String>,
    pub ai_api_key: Option<String>,
}

impl From<TeamBO> for TeamCredentials {
    fn from(value: TeamBO) -> Self {
        Self {
            vm_password: value.password,
            ai_api_key: value.ai_api_key,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct CreateTeamAPIKey {
    pub budget: f64,
}
