use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::{ApiError, ApiResult};
use axum::body::Body;
use axum::extract::Request;
use axum::extract::State;
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
