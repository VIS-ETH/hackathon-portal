use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::{ApiError, ApiResult};
use axum::body::Body;
use axum::extract::Request;
use axum::extract::State;
use axum::http::{Method, Uri};
use axum::middleware::Next;
use axum::response::Response;
use std::sync::Arc;
use tracing::{info, warn};
use uuid::Uuid;

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
        .create_or_get_user(&auth_result.auth_id, Some(&auth_result.name))
        .await
    else {
        return next.run(req).await;
    };

    let Ok(roles) = state.authorization_service.get_roles(user.id).await else {
        return next.run(req).await;
    };

    let ctx = Ctx::new(user, roles);

    req.extensions_mut().insert(Some(ctx));

    next.run(req).await
}

pub async fn mw_map_response(
    ctx: Option<Ctx>,
    uri: Uri,
    req_method: Method,
    res: Response,
) -> Response {
    let uuid = Uuid::new_v4();

    let api_error = res.extensions().get::<Arc<ApiError>>();

    info!(
        ?ctx,
        error = ?api_error,
        uuid = %uuid,
        status = %res.status(),
        method = ?req_method,
        uri = ?uri,
        "Request"
    );

    res
}
