mod docs;
mod events;

use crate::api_state::ApiState;
use crate::mw::{mw_impersonate, mw_map_response, mw_require_auth, mw_resolve_ctx};
use crate::routers::docs::get_swagger;
use crate::{ApiError, ApiResult};
use axum::extract::Request;
use axum::http::Method;
use axum::{middleware, Router};
use tower_http::cors::{Any, CorsLayer};

async fn handler_404(request: Request) -> ApiResult<()> {
    Err(ApiError::UrlNotFound {
        url: request.uri().to_string(),
    })
}

pub fn get_router(state: &ApiState) -> Router {
    Router::new().nest("/events", events::get_router(state))
}

pub async fn get_api_router(api_state: ApiState) -> ApiResult<Router> {
    let origins = if cfg!(debug_assertions) {
        vec![
            "http://localhost:3000".parse()?,
            "http://localhost:8080".parse()?,
        ]
    } else {
        vec!["https://hack.ethz.ch".parse()?]
    };

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

    let router = get_router(&api_state).route_layer(middleware::from_fn(mw_require_auth));
    let swagger = get_swagger();

    let api_router = Router::new()
        .nest("/api", router)
        .merge(swagger)
        .fallback(handler_404)
        .layer(middleware::map_response(mw_map_response))
        .layer(middleware::from_fn_with_state(api_state, mw_resolve_ctx))
        .layer(middleware::from_fn(mw_impersonate))
        .layer(cors);

    Ok(api_router)
}
