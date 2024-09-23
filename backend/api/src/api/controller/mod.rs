pub mod test;
use crate::appState::AppState;
use axum::Router;

pub fn get_router(state: &AppState) -> Router {
    Router::new().nest("/test", test::get_router(state))
}
