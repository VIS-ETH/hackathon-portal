mod docs;
mod health;

use crate::api_state::ApiState;
use crate::mw::mw_map_response;
use axum::{middleware, Router};
use docs::Docs;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .nest("/health", health::get_router(state))
        .layer(middleware::map_response(mw_map_response))
}

pub fn get_docs() -> Router {
    SwaggerUi::new("/docs")
        .url("/docs/openapi.json", Docs::openapi())
        .into()
}
