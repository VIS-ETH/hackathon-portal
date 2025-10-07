use crate::api_state::ApiState;
use crate::error::ApiJson;
use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};
use hackathon_portal_services::infrastructure::models::TraefikDynamicConfig;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/traefik", get(get_traefik_dynamic_config))
        .with_state(state.clone())
}

#[utoipa::path(
    get,
    path = "/api/infrastructure/traefik",
    responses(
        (status = StatusCode::OK, body = ()),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = TraefikDynamicConfig),
    ),
)]
pub async fn get_traefik_dynamic_config(
    State(state): State<ApiState>,
) -> ApiJson<TraefikDynamicConfig> {
    let config = state
        .infrastructure_service
        .get_traefik_dynamic_config()
        .await?;
    Ok(Json(config))
}
