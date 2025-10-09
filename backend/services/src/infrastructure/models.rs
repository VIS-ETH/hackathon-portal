use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema, Default)]
pub enum AccessControlMode {
    #[default]
    AuthenticationAuthorization,
    Authentication,
    None,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema, Default)]
pub enum ServerProtocol {
    #[default]
    Http,
    Https,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct ManagedIngressConfig {
    pub server_port: u16,
    pub access_control_mode: AccessControlMode,
}

impl Default for ManagedIngressConfig {
    fn default() -> Self {
        Self {
            server_port: 8080,
            access_control_mode: AccessControlMode::default(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct CustomIngressConfig {
    pub server_port: u16,
    pub server_protocol: ServerProtocol,
}

impl Default for CustomIngressConfig {
    fn default() -> Self {
        Self {
            server_port: 80,
            server_protocol: ServerProtocol::default(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(tag = "mode", content = "config", deny_unknown_fields)]
pub enum IngressMode {
    Managed(ManagedIngressConfig),
    Custom(CustomIngressConfig),
}

impl Default for IngressMode {
    fn default() -> Self {
        IngressMode::Managed(ManagedIngressConfig::default())
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct IngressConfig {
    pub version: u32,

    #[serde(flatten)]
    pub mode: IngressMode,
}

impl IngressConfig {
    #[must_use]
    pub fn assemble_url(
        &self,
        managed_address: Option<&str>,
        direct_address: Option<&str>,
    ) -> Option<String> {
        match &self.mode {
            IngressMode::Managed(_) => managed_address.map(|address| format!("https://{address}")),
            IngressMode::Custom(config) => {
                let protocol = match config.server_protocol {
                    ServerProtocol::Http => "http",
                    ServerProtocol::Https => "https",
                };

                direct_address
                    .map(|address| format!("{}://{}:{}", protocol, address, config.server_port))
            }
        }
    }
}

impl Default for IngressConfig {
    fn default() -> Self {
        Self {
            version: 1,
            mode: IngressMode::default(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TraefikDynamicConfig {
    #[serde(skip_serializing_if = "TraefikHttpConfig::is_empty")]
    pub http: TraefikHttpConfig,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TraefikHttpConfig {
    #[serde(skip_serializing_if = "HashMap::is_empty")]
    pub routers: HashMap<String, TraefikRouterConfig>,
    #[serde(skip_serializing_if = "HashMap::is_empty")]
    pub services: HashMap<String, TraefikServiceConfig>,
}

impl TraefikHttpConfig {
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.routers.is_empty() && self.services.is_empty()
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TraefikRouterConfig {
    pub rule: String,
    pub service: String,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub entry_points: Vec<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub middlewares: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TraefikServiceConfig {
    pub load_balancer: TraefikLoadBalancerConfig,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TraefikLoadBalancerConfig {
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub servers: Vec<TraefikServerConfig>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TraefikServerConfig {
    pub url: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn get_default_ingress_config() {
        // cargo test get_default_ingress_config -- --nocapture
        println!(
            "{}",
            serde_json::to_string(&IngressConfig::default()).unwrap()
        );
    }
}
