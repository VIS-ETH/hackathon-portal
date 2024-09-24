pub mod routes;

use crate::appState::AppState;
use axum::routing::{delete, get, post, put};
use axum::Router;

pub fn get_router(state: &AppState) -> Router {
    Router::new()
        .route("/", get(routes::get_all_events))
        .route("/:id", get(routes::get_event_by_id))
        .route("/", put(routes::put_event))
        .route("/:id/delete", delete(routes::delete_event_by_id))
        .route("/", post(routes::post_event))
        .with_state(state.clone())
}
