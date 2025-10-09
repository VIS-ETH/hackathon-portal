use chrono::NaiveDateTime;
use hackathon_portal_repositories::db::{db_event, EventPhase, EventVisibility};
use sea_orm::prelude::DateTime;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Event {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub start: DateTime,
    pub end: DateTime,
    pub welcome_content: Option<String>,
    pub documentation_content: Option<String>,
    pub max_team_size: u32,
    pub max_teams_per_project: u32,
    pub sidequest_cooldown: u32,
    pub managed_address_template: Option<String>,
    pub direct_address_template: Option<String>,
    pub private_address_template: Option<String>,
    pub ssh_config_template: Option<String>,
    pub read_only: bool,
    pub projects_visible: bool,
    pub project_assignments_visible: bool,
    pub feedback_visible: bool,
    pub visibility: EventVisibility,
    pub phase: EventPhase,
    pub discord_server_id: Option<String>,
    pub discord_config: Option<String>,
}

impl From<db_event::Model> for Event {
    fn from(value: db_event::Model) -> Self {
        Self {
            id: value.id,
            name: value.name,
            slug: value.slug,
            start: value.start,
            end: value.end,
            welcome_content: value.welcome_content,
            documentation_content: value.documentation_content,
            max_team_size: value.max_team_size as u32,
            max_teams_per_project: value.max_teams_per_project as u32,
            sidequest_cooldown: value.sidequest_cooldown as u32,
            managed_address_template: value.managed_address_template,
            direct_address_template: value.direct_address_template,
            private_address_template: value.private_address_template,
            ssh_config_template: value.ssh_config_template,
            read_only: value.read_only,
            projects_visible: value.projects_visible,
            project_assignments_visible: value.project_assignments_visible,
            feedback_visible: value.feedback_visible,
            visibility: value.visibility,
            phase: value.phase,
            discord_server_id: value.discord_server_id,
            discord_config: value.discord_config,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventForCreate {
    pub name: String,
    pub start: NaiveDateTime,
    pub end: NaiveDateTime,
    pub max_team_size: u32,
    pub sidequest_cooldown: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventForUpdate {
    pub name: Option<String>,
    pub start: Option<NaiveDateTime>,
    pub end: Option<NaiveDateTime>,
    pub welcome_content: Option<String>,
    pub documentation_content: Option<String>,
    pub max_team_size: Option<u32>,
    pub max_teams_per_project: Option<u32>,
    pub sidequest_cooldown: Option<u32>,
    pub managed_address_template: Option<String>,
    pub direct_address_template: Option<String>,
    pub private_address_template: Option<String>,
    pub ssh_config_template: Option<String>,
    pub read_only: Option<bool>,
    pub projects_visible: Option<bool>,
    pub project_assignments_visible: Option<bool>,
    pub feedback_visible: Option<bool>,
    pub visibility: Option<EventVisibility>,
    pub phase: Option<EventPhase>,
    pub discord_server_id: Option<String>,
    pub discord_config: Option<String>,
    pub master_ai_api_key: Option<String>,
}
