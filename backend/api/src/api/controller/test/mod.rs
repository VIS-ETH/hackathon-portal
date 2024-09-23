pub mod routes;

use crate::appState::AppState;
use axum::routing::get;
use axum::Router;

pub fn get_router(state: &AppState) -> Router {
    Router::new()
        .route("/", get(routes::get_test))
        .with_state(state.clone())
}
