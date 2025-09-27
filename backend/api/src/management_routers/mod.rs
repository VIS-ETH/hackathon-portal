mod docs;
mod health;

use crate::api_state::ApiState;
use crate::mw::{mw_map_response, mw_resolve_ctx};
use axum::{middleware, Router};
use docs::Docs;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

pub fn get_router(state: ApiState) -> Router {
    Router::new()
        .nest("/health", health::get_router(&state))
        .layer(middleware::map_response(mw_map_response))
        .layer(middleware::from_fn_with_state(state, mw_resolve_ctx))
}

pub fn get_docs() -> Router {
    SwaggerUi::new("/docs")
        .url("/docs/openapi.json", Docs::openapi())
        .into()
}
