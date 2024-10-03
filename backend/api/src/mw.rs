use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::{ApiError, ApiResult};
use axum::body::Body;
use axum::extract::Request;
use axum::extract::State;
use axum::http::{HeaderValue, Method, Uri};
use axum::middleware::Next;
use axum::response::Response;
use std::sync::Arc;
use tracing::info;
use uuid::Uuid;

const AUTH_ID_KEY: &str = "X-Authentik-Email";
const NAME_KEY: &str = "X-Authentik-Name";

#[allow(dead_code)]
pub async fn mw_impersonate(mut req: Request<Body>, next: Next) -> ApiResult<Response> {
    assert!(
        cfg!(debug_assertions),
        "Impersonation middleware is only available in debug mode."
    );

    let target_auth_id = "hannes.eberhard@hotmail.com";
    let target_name = "Hannes Eberhard";

    req.headers_mut()
        .insert(AUTH_ID_KEY, HeaderValue::from_str(target_auth_id)?);
    req.headers_mut()
        .insert(NAME_KEY, HeaderValue::from_str(target_name)?);

    Ok(next.run(req).await)
}

pub async fn mw_require_auth(ctx: Option<Ctx>, req: Request, next: Next) -> ApiResult<Response> {
    ctx.ok_or(ApiError::NoCtxInRequest)?;
    Ok(next.run(req).await)
}

pub async fn mw_resolve_ctx(
    State(state): State<ApiState>,
    mut req: Request<Body>,
    next: Next,
) -> Response {
    let Some(auth_id) = req
        .headers()
        .get(AUTH_ID_KEY)
        .and_then(|value| value.to_str().ok())
    else {
        return next.run(req).await;
    };

    let Some(name) = req
        .headers()
        .get(NAME_KEY)
        .and_then(|value| value.to_str().ok())
    else {
        return next.run(req).await;
    };

    let Ok(user) = state
        .user_service
        .create_or_get_user(auth_id, Some(name))
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
