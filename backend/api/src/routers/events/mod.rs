pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::models::AffectedRowsDTO;
use crate::routers::events::models::{EventDTO, InviteUsersDTO};
use crate::{ApiError, ApiResult};
use axum::extract::{Path, State};
use axum::routing::{delete, get, patch, post, put};
use axum::{Json, Router};
use chrono::NaiveDateTime;
use repositories::db::prelude::EventRole;
use services::event::model::EventForCreate;
use services::event::model::EventForPatch;
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(get_events))
        .route("/roles", get(get_events_roles))
        .route("/:event_id", get(get_event))
        .route("/:event_id", patch(patch_event))
        .route("/:event_id/roles", get(get_event_roles))
        .route("/:event_id/roles", put(put_event_roles))
        .route("/:event_id/roles", delete(delete_event_roles))
        .route("/:event_id/invite", post(invite_users))
        .with_state(state.clone())
}

#[utoipa::path(
    get,
    path = "/api/events",
    responses(
        (status = StatusCode::OK, body = Vec<EventDTO>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_events(ctx: Ctx, State(state): State<ApiState>) -> ApiResult<Json<Vec<EventDTO>>> {
    let events = state.event_service.get_events().await?;

    let events = events
        .into_iter()
        .filter(|event| {
            state
                .authorization_service
                .view_event_guard(ctx.roles(), event.id, event.visibility)
                .is_ok()
        })
        .collect::<Vec<_>>();

    let dto = events.into_iter().map(EventDTO::from).collect();

    Ok(Json(dto))
}

#[utoipa::path(
    post,
    path = "/api/events/{event_id}/invite",
    responses(
        (status = StatusCode::OK, body = AffectedRowsDTO),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn invite_users(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Json(body): Json<InviteUsersDTO>,
) -> ApiResult<Json<AffectedRowsDTO>> {
    state
        .authorization_service
        .edit_event_guard(ctx.roles(), event_id)?;

    let auth_ids = body
        .users
        .iter()
        .map(|user| user.auth_id.clone())
        .collect::<Vec<_>>();
    let roles = body.default_roles.iter().cloned().collect::<HashSet<_>>();

    let affected_rows = state.user_service.create_users(body.users).await?;
    let _ = state
        .authorization_service
        .assign_default_event_roles(event_id, auth_ids, roles)
        .await?;

    let dto = AffectedRowsDTO { affected_rows };

    Ok(Json(dto))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}",
    responses(
        (status = StatusCode::OK, body = GetEventResponse),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_event(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
) -> ApiResult<Json<EventDTO>> {
    let event = state.event_service.get_event(event_id).await?;

    state
        .authorization_service
        .view_event_guard(ctx.roles(), event.id, event.visibility)?;

    let dto = EventDTO::from(event);

    Ok(Json(dto))
}

#[utoipa::path(
    patch,
    path = "/api/events/{event_id}",
    responses(
        (status = StatusCode::OK, body = GetEventResponse),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn patch_event(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Json(body): Json<EventForPatch>,
) -> ApiResult<Json<EventDTO>> {
    state
        .authorization_service
        .edit_event_guard(ctx.roles(), event_id)?;

    let event = state.event_service.patch_event(event_id, &body).await?;

    let dto = EventDTO::from(event);

    Ok(Json(dto))
}

#[utoipa::path(
    get,
    path = "/api/events/roles",
    responses(
        (status = StatusCode::OK, body = HashMap<Uuid, HashSet<EventRole>>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_events_roles(ctx: Ctx) -> ApiResult<Json<HashMap<Uuid, HashSet<EventRole>>>> {
    let dto = ctx.roles().event.clone();
    Ok(Json(dto))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/roles",
    responses(
        (status = StatusCode::OK, body = HashSet<EventRole>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_event_roles(
    ctx: Ctx,
    Path(event_id): Path<Uuid>,
) -> ApiResult<Json<HashSet<EventRole>>> {
    let dto = ctx
        .roles()
        .event
        .get(&event_id)
        .cloned()
        .unwrap_or_default();
    Ok(Json(dto))
}

#[utoipa::path(
    put,
    path = "/api/events/{event_id}/roles",
    responses(
        (status = StatusCode::OK, body = AffectedRowsDTO),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn put_event_roles(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Json(body): Json<HashMap<Uuid, HashSet<EventRole>>>,
) -> ApiResult<Json<AffectedRowsDTO>> {
    state
        .authorization_service
        .edit_event_guard(ctx.roles(), event_id)?;

    let affected_rows = state
        .authorization_service
        .assign_event_roles(event_id, body)
        .await?;

    let dto = AffectedRowsDTO { affected_rows };

    Ok(Json(dto))
}

#[utoipa::path(
    delete,
    path = "/api/events/{event_id}/roles",
    responses(
        (status = StatusCode::OK, body = AffectedRowsDTO),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn delete_event_roles(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Json(body): Json<HashMap<Uuid, HashSet<EventRole>>>,
) -> ApiResult<Json<AffectedRowsDTO>> {
    state
        .authorization_service
        .edit_event_guard(ctx.roles(), event_id)?;

    // Prevent admins from unassigning themselves
    if body
        .get(&ctx.user().id)
        .is_some_and(|roles| roles.contains(&EventRole::Admin))
    {
        return Err(ApiError::Forbidden {
            resource: "event".to_string(),
            id: event_id.to_string(),
            action: "unassign self".to_string(),
        });
    }

    let affected_rows = state
        .authorization_service
        .unassign_event_roles(event_id, body)
        .await?;

    let dto = AffectedRowsDTO { affected_rows };

    Ok(Json(dto))
}
