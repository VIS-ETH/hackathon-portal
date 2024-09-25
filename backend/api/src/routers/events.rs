use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::ApiResult;
use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};
use services::event::model::ListEventsResponse;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(list_events))
        .with_state(state.clone())
}

pub async fn list_events(
    ctx: Ctx,
    State(state): State<ApiState>,
) -> ApiResult<Json<ListEventsResponse>> {
    let dto = state.event_service.list(&ctx.into()).await?;
    Ok(Json(dto))
}
