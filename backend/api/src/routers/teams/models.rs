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
}

impl From<(TeamBO, bool)> for Team {
    fn from(value: (TeamBO, bool)) -> Self {
        let (team, can_view_project_assignment) = value;

        let project_id = if can_view_project_assignment {
            team.project_id
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
