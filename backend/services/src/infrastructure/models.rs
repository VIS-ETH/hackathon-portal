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
    pub http: TraefikHttpConfig,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TraefikHttpConfig {
    pub routers: HashMap<String, TraefikRouterConfig>,
    pub services: HashMap<String, TraefikServiceConfig>,
    pub middlewares: HashMap<String, TraefikMiddlewareConfig>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TraefikRouterConfig {
    pub rule: String,
    pub service: String,
    pub entry_points: Vec<String>,
    pub middlewares: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TraefikServiceConfig {
    pub load_balancer: TraefikLoadBalancerConfig,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TraefikLoadBalancerConfig {
    pub servers: Vec<TraefikServerConfig>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TraefikServerConfig {
    pub url: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TraefikForwardAuthConfig {
    pub address: String,
    pub auth_response_headers: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub enum TraefikMiddlewareConfig {
    ForwardAuth(TraefikForwardAuthConfig),
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
