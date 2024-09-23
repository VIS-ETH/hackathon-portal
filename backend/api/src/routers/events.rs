use crate::api_state::ApiState;
use crate::Result;
use axum::extract::State;
use axum::routing::{get, patch, post};
use axum::{Extension, Json, Router};
use services::ctx::Ctx;
use services::event::model::{GetEventResponse, ListEventsResponse};
use services::event::EventService;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(list_events))
        .with_state(state.clone())
}

pub async fn list_events(
    State(state): State<ApiState>,
    Extension(event_service): Extension<EventService>,
) -> Json<ListEventsResponse> {
    let ctx = Ctx::from_service();

    let dto = event_service.list(&ctx, &state.db_repo).await.unwrap();

    Json(dto)
}
