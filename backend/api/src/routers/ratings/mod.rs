pub mod expert;
pub mod models;
pub mod public;
pub mod technical;

use axum::Router;

use crate::api_state::ApiState;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .nest("/public", public::get_router(state))
        .nest("/expert", expert::get_router(state))
        .nest("/technical", technical::get_router(state))
}
