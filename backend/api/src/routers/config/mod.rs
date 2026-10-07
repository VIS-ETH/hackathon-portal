use crate::api_state::ApiState;
use crate::error::ApiJson;
use crate::routers::config::models::ClientConfig;
use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};

pub mod models;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(get_config))
        .with_state(state.clone())
}

#[utoipa::path(
    get,
    path = "/api/config",
    responses(
        (status = StatusCode::OK, body = ClientConfig),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_config(State(state): State<ApiState>) -> ApiJson<ClientConfig> {
    Ok(Json(ClientConfig::clone(&state.client_config)))
}
