use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::PublicError;
use crate::{ApiError, ApiResult};
use axum::extract::State;
use axum::http::{HeaderMap, HeaderValue};
use axum::routing::get;
use axum::Router;
use hackathon_portal_repositories::db::{EventRole, TeamRole};
use hackathon_portal_services::infrastructure::models::{AccessControlMode, IngressMode};
use percent_encoding::{utf8_percent_encode, AsciiSet, CONTROLS};
use std::collections::HashMap;
use std::sync::Arc;
use tracing::{info, warn};

/// Header values are decoded as Latin-1 by most frameworks, so non-ASCII characters
/// (always encoded by `utf8_percent_encode`) are percent-encoded, while ASCII names
/// are passed through unchanged. `%` is encoded to keep decoding unambiguous.
const USER_NAME_ENCODE_SET: &AsciiSet = &CONTROLS.add(b'%');

fn encode_user_name(name: &str) -> String {
    utf8_percent_encode(name, USER_NAME_ENCODE_SET).to_string()
}

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/authorization", get(check_authorization))
        .with_state(state.clone())
}

/// Authorize a request to the managed ingress of a team
///
/// Forward-auth endpoint for Traefik. Matches `X-Forwarded-Host` to a team.
#[utoipa::path(
    get,
    path = "/api/auth/authorization",
    responses(
        (status = StatusCode::OK, body = (), headers(
            ("X-User-Id" = String, description = "Auth id of the user, unless access control is off"),
            ("X-User-Name" = String, description = "Name of the user with non-ASCII characters percent-encoded (UTF-8), unless access control is off"),
        )),
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

                    let managed_address = t.managed_address.clone()?;

                    Some((managed_address, t))
                })
                .collect::<HashMap<_, _>>();

            Ok(Arc::new(map))
        })
        .await?;

    let Some(team) = host_to_team.get(host) else {
        return Err(ApiError::Forbidden {
            action: format!("access the host {host} as it does not match known host"),
        });
    };

    let managed_config = match &team.ingress_config.mode {
        IngressMode::Managed(c) => c,
        IngressMode::Custom(_) => {
            return Err(ApiError::Forbidden {
                action: format!("access the host {host} as it does not match known host"),
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
                    action: format!("access the host {host} as you do not have the required roles"),
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
    response_headers.insert(
        "X-User-Name",
        HeaderValue::from_str(&encode_user_name(&ctx.user().name))?,
    );

    Ok(response_headers)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encode_user_name_only_encodes_non_ascii() {
        assert_eq!(encode_user_name("John Doe"), "John Doe");
        assert_eq!(encode_user_name("Zoë"), "Zo%C3%AB");
        assert_eq!(encode_user_name("100%"), "100%25");
    }
}
