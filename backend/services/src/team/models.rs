use crate::infrastructure::models::IngressConfig;
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
    pub password: Option<String>,
    pub ai_api_key: Option<String>,
    pub comment: Option<String>,
    pub extra_score: Option<f64>,
    pub managed_address_override: Option<String>,
    pub direct_address_override: Option<String>,
    pub private_address_override: Option<String>,
    pub ssh_config_override: Option<String>,
    pub ingress_enabled: Option<bool>,
    pub ingress_config: Option<IngressConfig>,
}
