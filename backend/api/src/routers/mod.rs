mod docs;
mod events;

use crate::api_state::ApiState;
use crate::mw::{mw_require_auth, mw_resolve_ctx};
use crate::routers::docs::get_swagger;
use axum::extract::Request;
use axum::http::{Method, StatusCode};
use axum::response::IntoResponse;
use axum::{middleware, Router};
use tower_http::cors::{Any, CorsLayer};
use utoipa::OpenApi;
use crate::ApiResult;

async fn handler_404(request: Request) -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        format!("Not Found: {}", request.uri().path()),
    )
}

pub fn get_router(state: &ApiState) -> Router {
    Router::new().nest("/events", events::get_router(state))
}

pub async fn get_api_router(api_state: ApiState) -> ApiResult<Router> {
    let origins = ["http://localhost:3000".parse()?];

    let cors = CorsLayer::new()
        .allow_methods([
            Method::OPTIONS,
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::HEAD,
            Method::TRACE,
            Method::CONNECT,
            Method::PATCH,
        ])
        .allow_headers(Any)
        .allow_origin(origins)
        .allow_credentials(false);

    let router = get_router(&api_state)
        .route_layer(middleware::from_fn(mw_require_auth))
        .layer(middleware::from_fn_with_state(api_state, mw_resolve_ctx));

    let swagger = get_swagger();

    let api_router = Router::new()
        .nest("/api", router)
        .merge(swagger)
        .fallback(handler_404)
        .layer(cors);

    Ok(api_router)
}
