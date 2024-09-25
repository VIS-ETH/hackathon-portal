use std::sync::Arc;
use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::{ApiError, ApiResult, PublicError};
use axum::body::Body;
use axum::extract::Request;
use axum::extract::State;
use axum::http::{HeaderValue, Method, StatusCode, Uri};
use axum::Json;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use tracing::info;
use services::ctx::Ctx as ServiceCtx;
use uuid::Uuid;

const AUTH_ID_KEY: &str = "X-Authentik-Email";

pub async fn mw_impersonate(mut req: Request<Body>, next: Next) -> ApiResult<Response> {
    if !cfg!(debug_assertions) {
        panic!("Impersonation middleware is only available in debug mode.");
    }

    let target_auth_id = "hannes.eberhard@hotmail.com";

    req.headers_mut()
        .insert(AUTH_ID_KEY, HeaderValue::from_str(target_auth_id)?);

    Ok(next.run(req).await)
}

pub async fn mw_require_auth(ctx: Option<Ctx>, req: Request, next: Next) -> ApiResult<Response> {
    ctx.ok_or(ApiError::NoCtxInRequest)?;
    Ok(next.run(req).await)
}

pub async fn mw_resolve_ctx(
    State(state): State<ApiState>,
    req: Request<Body>,
    next: Next,
) -> Response {
    let Some(auth_id) = req
        .headers()
        .get(AUTH_ID_KEY)
        .and_then(|value| value.to_str().ok())
    else {
        return next.run(req).await;
    };

    let Ok(user) = state.user_service.get_or_create(auth_id).await else {
        return next.run(req).await;
    };

    let ctx = Ctx::new(ServiceCtx::from_regular(user));

    let mut req = req;
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
    let public_error = api_error.map(|error| PublicError::from(error.as_ref()));
    let public_error_response = public_error.map(|error| error.into_response());

    info!(
        user = ?ctx.as_ref().map(|ctx| ctx.user()),
        error = ?api_error,
        uuid = %uuid,
        status = %res.status(),
        method = ?req_method,
        uri = ?uri,
        "Request"
    );

    if let Some(public_error_response) = public_error_response {
        public_error_response
    } else {
        res
    }
}
