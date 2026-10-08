use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::{ApiError, ApiResult};
use axum::body::Body;
use axum::extract::Request;
use axum::extract::State;
use axum::http::{header, HeaderValue, Method};
use axum::middleware::Next;
use axum::response::Response;
use hackathon_portal_services::user::models::UserForCreate;
use std::sync::Arc;
use std::time::Instant;
use tracing::{error, info, warn};
use uuid::Uuid;

#[derive(Clone, Copy)]
struct ResolvedUserId(Uuid);

pub async fn mw_require_auth(ctx: Option<Ctx>, req: Request, next: Next) -> ApiResult<Response> {
    ctx.ok_or(ApiError::NoCtxInRequest)?;
    Ok(next.run(req).await)
}

/// Team apps are same-site with the portal, so the browser attaches the session cookie to writes they
/// trigger. CORS only hides the response, this rejects the request itself.
pub async fn mw_check_origin(
    State(allowed_origins): State<Arc<[HeaderValue]>>,
    req: Request,
    next: Next,
) -> ApiResult<Response> {
    if !is_allowed_origin(
        req.method(),
        req.headers().get(header::ORIGIN),
        &allowed_origins,
    ) {
        return Err(ApiError::Forbidden {
            action: "send this request from another site".to_string(),
        });
    }

    Ok(next.run(req).await)
}

/// Browsers send Origin on every request that isn't a GET or HEAD, so a missing one means a non-browser client.
fn is_allowed_origin(
    method: &Method,
    origin: Option<&HeaderValue>,
    allowed_origins: &[HeaderValue],
) -> bool {
    if matches!(*method, Method::GET | Method::HEAD | Method::OPTIONS) {
        return true;
    }

    origin.is_none_or(|origin| allowed_origins.contains(origin))
}

pub async fn mw_resolve_ctx(
    State(state): State<ApiState>,
    mut req: Request<Body>,
    next: Next,
) -> Response {
    let auth_result = match state.authenticator.validate(&req) {
        Ok(Some(result)) => result,
        Ok(None) => return next.run(req).await,
        Err(e) => {
            warn!(error = %e, "Failed to authenticate request");
            return next.run(req).await;
        }
    };

    let Ok(user) = state
        .user_service
        .create_or_get_user(UserForCreate {
            auth_id: auth_result.auth_id,
            name: Some(auth_result.name),
        })
        .await
    else {
        return next.run(req).await;
    };

    let Ok(roles) = state.authorization_service.get_roles(user.id).await else {
        return next.run(req).await;
    };

    let user_id = user.id;
    let ctx = Ctx::new(user, roles);

    req.extensions_mut().insert(Some(ctx));

    let mut res = next.run(req).await;
    res.extensions_mut().insert(ResolvedUserId(user_id));

    res
}

pub async fn mw_log_request(req: Request, next: Next) -> Response {
    let method = req.method().clone();
    let uri = req.uri().clone();
    let start = Instant::now();

    let res = next.run(req).await;

    let latency_ms = start.elapsed().as_millis();
    let status = res.status();
    let user_id = res.extensions().get::<ResolvedUserId>().map(|id| id.0);
    let api_error = res.extensions().get::<Arc<ApiError>>();

    macro_rules! log {
        ($level:ident) => {
            $level!(
                user_id = user_id.map(display),
                error = ?api_error,
                status = %status,
                method = ?method,
                uri = ?uri,
                latency_ms,
                "Request"
            )
        };
    }

    match status {
        s if s.is_server_error() => log!(error),
        s if s.is_client_error() => log!(warn),
        _ => log!(info),
    }

    res
}

#[cfg(test)]
mod tests {
    use super::*;

    const PORTAL: &str = "https://hackathon.ethz.ch";
    const TEAM: &str = "https://01.hackathon.ethz.ch";
    // shares *.hackathon.ethz.ch with prod, so it is same-site too
    const STAGING: &str = "https://staging.hackathon.ethz.ch";

    fn allowed(method: &Method, origin: Option<&'static str>) -> bool {
        let origin = origin.map(HeaderValue::from_static);
        is_allowed_origin(method, origin.as_ref(), &[HeaderValue::from_static(PORTAL)])
    }

    #[test]
    fn is_allowed_origin_lets_safe_methods_through() {
        assert!(allowed(&Method::GET, Some(TEAM)));
        assert!(allowed(&Method::HEAD, Some(TEAM)));
        assert!(allowed(&Method::OPTIONS, Some(TEAM)));
    }

    #[test]
    fn is_allowed_origin_checks_writes() {
        assert!(allowed(&Method::POST, None));
        assert!(allowed(&Method::POST, Some(PORTAL)));
        assert!(!allowed(&Method::POST, Some(TEAM)));
        assert!(!allowed(&Method::PUT, Some(TEAM)));
        assert!(!allowed(&Method::PATCH, Some(TEAM)));
        assert!(!allowed(&Method::DELETE, Some(TEAM)));
        assert!(!allowed(&Method::POST, Some("null")));
        assert!(!allowed(&Method::POST, Some(STAGING)));
    }

    #[test]
    fn is_allowed_origin_matches_exactly() {
        assert!(!allowed(&Method::POST, Some("https://hackathon.ethz.ch/")));
        assert!(!allowed(&Method::POST, Some("http://hackathon.ethz.ch")));
        assert!(!allowed(
            &Method::POST,
            Some("https://hackathon.ethz.ch:8443")
        ));
    }

    #[test]
    fn is_allowed_origin_with_empty_allowlist_only_lets_non_browsers_write() {
        let portal = HeaderValue::from_static(PORTAL);
        assert!(!is_allowed_origin(&Method::POST, Some(&portal), &[]));
        assert!(is_allowed_origin(&Method::POST, None, &[]));
    }
}
