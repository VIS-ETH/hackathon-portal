use crate::infrastructure::models::IngressConfig;
use hackathon_portal_repositories::db::BlogSectionLayout;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct Team {
    pub id: Uuid,
    pub event_id: Uuid,
    pub project_id: Option<Uuid>,
    pub name: String,
    pub slug: String,
    pub index: i32,
    pub photo_id: Option<Uuid>,
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
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamForCreate {
    pub event_id: Uuid,
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamForUpdate {
    pub name: Option<String>,
    pub project_id: Option<Uuid>,
    pub photo_id: Option<Uuid>,
    pub comment: Option<String>,
    pub extra_score: Option<f64>,
    pub managed_address_override: Option<String>,
    pub direct_address_override: Option<String>,
    pub private_address_override: Option<String>,
    pub ssh_config_override: Option<String>,
    pub ingress_enabled: Option<bool>,
    pub ingress_config: Option<IngressConfig>,
    pub finalist: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamBlogSection {
    pub content: String,
    pub layout: BlogSectionLayout,
    pub image_id: Option<Uuid>,
    pub image_url: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamBlogSectionForUpdate {
    pub content: String,
    pub layout: BlogSectionLayout,
    pub image_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamBlog {
    pub version: i32,
    pub sections: Vec<TeamBlogSection>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct TeamBlogForUpdate {
    /// The version of the blog the update is based on.
    pub version: i32,
    pub sections: Vec<TeamBlogSectionForUpdate>,
}
