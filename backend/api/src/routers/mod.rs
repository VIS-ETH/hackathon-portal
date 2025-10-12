mod appointments;
mod docs;
mod events;
mod projects;
mod ratings;
mod sidequest_attempts;
mod sidequests;
mod teams;
mod uploads;
mod users;

use crate::api_state::ApiState;
use crate::mw::{mw_require_auth, mw_resolve_ctx};
use crate::routers::docs::Docs;
use axum::{middleware, Router};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

pub fn get_router(state: ApiState) -> Router {
    Router::new()
        .nest("/users", users::get_router(&state))
        .nest("/events", events::get_router(&state))
        .nest("/teams", teams::get_router(&state))
        .nest("/ratings", ratings::get_router(&state))
        .nest("/projects", projects::get_router(&state))
        .nest("/sidequests", sidequests::get_router(&state))
        .nest(
            "/sidequest-attempts",
            sidequest_attempts::get_router(&state),
        )
        .nest("/appointments", appointments::get_router(&state))
        .nest("/uploads", uploads::get_router(&state))
        .route_layer(middleware::from_fn(mw_require_auth))
        .layer(middleware::from_fn_with_state(state, mw_resolve_ctx))
}

pub fn get_docs() -> Router {
    SwaggerUi::new("/docs")
        .url("/docs/openapi.json", Docs::openapi())
        .into()
}
