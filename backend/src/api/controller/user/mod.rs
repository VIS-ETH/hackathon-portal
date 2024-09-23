pub mod routes;

use crate::appState::AppState;
use axum::routing::{delete, get, post, put};
use axum::Router;

pub fn get_router(state: &AppState) -> Router {
    Router::new()
        .route("/", get(routes::get_all_users))
        .route("/:id", get(routes::get_user_by_id))
        .route("/:id/delete", delete(routes::delete_user_by_id))
        .route("/", post(routes::post_user))
        .with_state(state.clone())
}
