use crate::api_state::ApiState;
use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};
use services::ctx::Ctx;
use services::event::model::ListEventsResponse;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(list_events))
        .with_state(state.clone())
}

pub async fn list_events(State(state): State<ApiState>) -> Json<ListEventsResponse> {
    let ctx = Ctx::from_service();

    let dto = state.event_service.list(&ctx).await.unwrap();

    Json(dto)
}
