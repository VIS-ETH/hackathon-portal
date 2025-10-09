use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::{ApiError, ApiResult};
use axum::extract::State;
use axum::http::{HeaderMap, HeaderValue};
use axum::routing::get;
use axum::Router;
use hackathon_portal_repositories::db::{EventRole, TeamRole};
use hackathon_portal_services::infrastructure::models::{AccessControlMode, IngressMode};
use std::collections::HashMap;
use std::sync::Arc;
use tracing::{info, warn};

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/authorization", get(check_authorization))
        .with_state(state.clone())
}

#[utoipa::path(
    get,
    path = "/api/auth/authorization",
    responses(
        (status = StatusCode::OK, body = ()),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn check_authorization(
    ctx: Ctx,
    headers: HeaderMap,
    State(state): State<ApiState>,
) -> ApiResult<HeaderMap> {
    let host = headers
        .get("X-Forwarded-Host")
        .ok_or_else(|| ApiError::BadRequest {
            reason: "Missing 'X-Forwarded-Host' header".to_string(),
        })?
        .to_str()?;

    let host_to_team = state
        .host_to_team_cache
        .try_get_with::<_, ApiError>((), async {
            info!("Refreshing host to team cache");

            let map = state
                .team_service
                .get_all_teams()
                .await?
                .into_iter()
                .filter_map(|t| {
                    if !t.ingress_enabled {
                        return None;
                    }

                    let Some(managed_address) = t.managed_address.clone() else {
                        return None;
                    };

                    Some((managed_address, t))
                })
                .collect::<HashMap<_, _>>();

            Ok(Arc::new(map))
        })
        .await?;

    let Some(team) = host_to_team.get(host) else {
        return Err(ApiError::Forbidden {
            action: format!("Access the host {host} as it does not match known host"),
        });
    };

    let managed_config = match &team.ingress_config.mode {
        IngressMode::Managed(c) => c,
        IngressMode::Custom(_) => {
            return Err(ApiError::Forbidden {
                action: format!("Access the host {host} as it does not match known host"),
            });
        }
    };

    match managed_config.access_control_mode {
        AccessControlMode::AuthenticationAuthorization => {
            let event_roles = ctx
                .roles()
                .event
                .get(&team.event_id)
                .cloned()
                .unwrap_or_default();

            let team_roles = ctx.roles().team.get(&team.id).cloned().unwrap_or_default();

            let has_event_permissions =
                [EventRole::Admin, EventRole::Stakeholder, EventRole::Mentor]
                    .iter()
                    .any(|r| event_roles.contains(r));

            let has_team_permissions = [TeamRole::Mentor, TeamRole::Member]
                .iter()
                .any(|r| team_roles.contains(r));

            if !has_event_permissions && !has_team_permissions {
                return Err(ApiError::Forbidden {
                    action: format!("Access the host {host} as you do not have the required roles"),
                });
            }
        }
        AccessControlMode::Authentication => {}
        AccessControlMode::None => {
            warn!(host = ?host, "Authorization attempted on host with access control mode 'None'");
            return Ok(HeaderMap::new());
        }
    }

    let mut response_headers = HeaderMap::new();
    response_headers.insert("X-User-Id", HeaderValue::from_str(&ctx.user().auth_id)?);
    response_headers.insert("X-User-Name", HeaderValue::from_str(&ctx.user().name)?);

    Ok(response_headers)
}
