use crate::infrastructure::models::{
    AccessControlMode, IngressMode, ManagedIngressConfig, TraefikDynamicConfig, TraefikHttpConfig,
    TraefikLoadBalancerConfig, TraefikRouterConfig, TraefikServerConfig, TraefikServiceConfig,
};
use crate::team::models::Team;
use crate::team::TeamService;
use crate::{ServiceError, ServiceResult};
use itertools::Itertools;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tracing::warn;

pub mod models;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TraefikConfig {
    #[serde(default = "TraefikConfig::default_entrypoints")]
    pub entrypoints: Vec<String>,
    pub auth_middlewares: Vec<String>,
    #[serde(default = "TraefikConfig::default_default_middlewares")]
    pub default_middlewares: Vec<String>, // applies after auth middlewares
}

impl TraefikConfig {
    #[must_use]
    pub fn default_entrypoints() -> Vec<String> {
        vec!["web".to_string()]
    }

    #[must_use]
    pub fn default_default_middlewares() -> Vec<String> {
        vec![]
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(deny_unknown_fields)]
pub struct InfrastructureConfig {
    pub traefik: Option<TraefikConfig>,
}

#[derive(Clone)]
pub struct InfrastructureService {
    config: InfrastructureConfig,
    team_service: Arc<TeamService>,
}

impl InfrastructureService {
    #[must_use]
    pub const fn new(config: InfrastructureConfig, team_service: Arc<TeamService>) -> Self {
        Self {
            config,
            team_service,
        }
    }

    pub async fn get_traefik_dynamic_config(&self) -> ServiceResult<TraefikDynamicConfig> {
        let Some(config) = &self.config.traefik else {
            return Err(ServiceError::DependencyMissing {
                dependency: "InfrastructureService.config.traefik".to_string(),
            });
        };

        let teams_with_ingress_config = self
            .team_service
            .get_all_teams()
            .await?
            .into_iter()
            .filter(|team| team.ingress_enabled)
            .filter_map(|team| match &team.ingress_config.mode {
                IngressMode::Managed(config) => Some((team.clone(), config.clone())),
                IngressMode::Custom(_) => None,
            })
            .collect_vec();

        let mut routers = HashMap::new();
        let mut services = HashMap::new();

        for (team, ingress_config) in teams_with_ingress_config {
            let key = format!("team-{}-{}", team.slug, team.id);

            let (Some(router), Some(service)) = (
                Self::get_traefik_team_router(config, &key, &team, &ingress_config),
                Self::get_traefik_team_service(&team, &ingress_config),
            ) else {
                continue;
            };

            routers.insert(key.clone(), router);
            services.insert(key, service);
        }

        let dynamic_config = TraefikDynamicConfig {
            http: TraefikHttpConfig { routers, services },
        };

        Ok(dynamic_config)
    }

    fn get_traefik_team_router(
        config: &TraefikConfig,
        key: &str,
        team: &Team,
        ingress_config: &ManagedIngressConfig,
    ) -> Option<TraefikRouterConfig> {
        let Some(managed_address) = team.managed_address.as_deref() else {
            warn!(team = ?team.id, "Team has ingress enabled but no managed address, skipping");
            return None;
        };

        let rule =
            format!("Host(`{managed_address}`) || Header(`X-Forwarded-Host`, `{managed_address}`)");

        let mut middlewares = if matches!(
            ingress_config.access_control_mode,
            AccessControlMode::AuthenticationAuthorization | AccessControlMode::Authentication
        ) {
            config.auth_middlewares.clone()
        } else {
            vec![]
        };

        middlewares.extend(config.default_middlewares.clone());

        let service = TraefikRouterConfig {
            rule,
            service: key.to_string(),
            entry_points: config.entrypoints.clone(),
            middlewares,
        };

        Some(service)
    }

    fn get_traefik_team_service(
        team: &Team,
        ingress_config: &ManagedIngressConfig,
    ) -> Option<TraefikServiceConfig> {
        let Some(private_address) = team.private_address.as_deref() else {
            warn!(team = ?team.id, "Team has ingress enabled but no private address");
            return None;
        };

        let service = TraefikServiceConfig {
            load_balancer: TraefikLoadBalancerConfig {
                servers: vec![TraefikServerConfig {
                    url: format!("http://{private_address}:{}", ingress_config.server_port),
                }],
            },
        };

        Some(service)
    }
}
