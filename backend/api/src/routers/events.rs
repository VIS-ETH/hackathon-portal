use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::ApiResult;
use axum::extract::{Path, State};
use axum::routing::get;
use axum::{Json, Router};
use repositories::db::prelude::EventRole;
use services::ctx::ServiceCtx;
use services::event::model::{
    GetEventResponse, GetEventRolesResponse, GetEventsResponse, GetEventsRolesResponse,
};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(get_events))
        .route("/roles", get(get_events_roles))
        .route("/:event_id", get(get_event))
        .route("/:event_id/roles", get(get_event_roles))
        .with_state(state.clone())
}

#[utoipa::path(
    get,
    path = "/api/events",
    responses(
        (status = StatusCode::OK, body = ListEventsResponse),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_events(
    ctx: Ctx,
    State(state): State<ApiState>,
) -> ApiResult<Json<GetEventsResponse>> {
    let dto = state.event_service.get_events(&ctx).await?;
    Ok(Json(dto))
}

#[utoipa::path(
    get,
    path = "/api/events/roles",
    responses(
        (status = StatusCode::OK, body = GetEventsRolesResponse),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_events_roles(
    ctx: Ctx,
    State(state): State<ApiState>,
) -> ApiResult<Json<GetEventsRolesResponse>> {
    todo!()
    // let dto = state.event_service.get_events_roles(&ctx).await?;
    // Ok(Json(dto))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}",
    responses(
        (status = StatusCode::OK, body = GetEventRolesResponse),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_event(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
) -> ApiResult<Json<GetEventResponse>> {
    let dto = state.event_service.get_event(event_id, &ctx).await?;
    Ok(Json(dto))
}

#[utoipa::path(
    patch,
    path = "/api/events/{event_id}",
    responses(
        (status = StatusCode::OK, body = GetEventRolesResponse),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn patch_event(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
) -> ApiResult<Json<GetEventResponse>> {
    let dto = state.event_service.get_event(event_id, &ctx).await?;
    Ok(Json(dto))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/roles",
    responses(
        (status = StatusCode::OK, body = HashMap<Uuid, HashSet<EventRole>>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_event_roles(
    ctx: Ctx,
    Path(event_id): Path<Uuid>,
) -> ApiResult<Json<HashSet<EventRole>>> {
    Ok(Json(ctx.event_roles(event_id)))
}
