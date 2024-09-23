use crate::appState::AppState;
use crate::error::BackendResult;
use axum::extract::{Path, Query, State};
use axum::Json;
use utoipauto::utoipauto;

#[utoipa::path(
    get,
    path = "/api/test",
    responses(
        (status = StatusCode::OK, body = bool),
    )
)]
pub async fn get_test(state: State<AppState>) -> BackendResult<Json<bool>> {
    Ok(Json(false))
}
