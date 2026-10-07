use crate::api_state::ApiState;
use crate::error::{ApiJson, PublicError};
use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/liveness", get(get_liveness))
        .route("/readiness", get(get_readiness))
        .with_state(state.clone())
}

/// Check liveness
#[utoipa::path(
    get,
    path = "/api/health/liveness",
    responses(
        (status = StatusCode::OK, body = ()),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_liveness(State(state): State<ApiState>) -> ApiJson<()> {
    state.health_service.check_liveness()?;
    Ok(Json(()))
}

/// Check readiness
#[utoipa::path(
    get,
    path = "/api/health/readiness",
    responses(
        (status = StatusCode::OK, body = ()),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_readiness(State(state): State<ApiState>) -> ApiJson<()> {
    state.health_service.check_readiness().await?;
    Ok(Json(()))
}
