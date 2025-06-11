pub mod models;

use super::events::models::EventIdQuery;
use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::{ApiJson, ApiJsonVec};
use crate::ApiError;
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use hackathon_portal_services::authorization::groups::Groups;
use hackathon_portal_services::sidequest::models::{
    Sidequest, SidequestForCreate, SidequestForUpdate,
};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", post(create_sidequest))
        .route("/", get(get_sidequests))
        .route(
            "/slug/:event_slug/:sidequest_slug",
            get(get_sidequest_by_slug),
        )
        .route("/:sidequest_id", get(get_sidequest))
        .route("/:sidequest_id", patch(update_sidequest))
        .route("/:sidequest_id", delete(delete_sidequest))
        .with_state(state.clone())
}

#[utoipa::path(
    post,
    path = "/api/sidequests",
    responses(
        (status = StatusCode::OK, body = SidequestForCreate),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn create_sidequest(
    ctx: Ctx,
    State(state): State<ApiState>,
    Json(body): Json<SidequestForCreate>,
) -> ApiJson<Sidequest> {
    let event = state.event_service.get_event(body.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_sidequest(event.visibility, event.phase, event.is_read_only) {
        return Err(ApiError::Forbidden {
            action: "create a sidequest for this event".to_string(),
        });
    }

    let sidequest = state.sidequest_service.create_sidequest(body).await?;

    Ok(Json(sidequest))
}

#[utoipa::path(
    get,
    path = "/api/sidequests",
    responses(
        (status = StatusCode::OK, body = Vec<Sidequest>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id"= Uuid, Query, description= "Filter by event ID"),
    )
)]
pub async fn get_sidequests(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
) -> ApiJsonVec<Sidequest> {
    let event = state.event_service.get_event(query.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event_internal(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view sidequests for this event".to_string(),
        });
    }

    let sidequests = state.sidequest_service.get_sidequests(event.id).await?;

    Ok(Json(sidequests))
}

#[utoipa::path(
    get,
    path = "/api/sidequests/slug/{event_slug}/{sidequest_slug}",
    responses(
        (status = StatusCode::OK, body = Sidequest),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_sidequest_by_slug(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path((event_slug, sidequest_slug)): Path<(String, String)>,
) -> ApiJson<Sidequest> {
    let sidequest = state
        .sidequest_service
        .get_sidequest_by_slug(&event_slug, &sidequest_slug)
        .await?;

    let event = state.event_service.get_event(sidequest.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event_internal(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view this sidequest".to_string(),
        });
    }

    Ok(Json(sidequest))
}

#[utoipa::path(
    get,
    path = "/api/sidequests/{sidequest_id}",
    responses(
        (status = StatusCode::OK, body = Sidequest),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_sidequest(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(sidequest_id): Path<Uuid>,
) -> ApiJson<Sidequest> {
    let sidequest = state.sidequest_service.get_sidequest(sidequest_id).await?;
    let event = state.event_service.get_event(sidequest.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event_internal(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view this sidequest".to_string(),
        });
    }

    let sidequest = state.sidequest_service.get_sidequest(sidequest_id).await?;

    Ok(Json(sidequest))
}

#[utoipa::path(
    patch,
    path = "/api/sidequests/{sidequest_id}",
    responses(
        (status = StatusCode::OK, body = Sidequest),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn update_sidequest(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(sidequest_id): Path<Uuid>,
    Json(body): Json<SidequestForUpdate>,
) -> ApiJson<Sidequest> {
    let sidequest = state.sidequest_service.get_sidequest(sidequest_id).await?;
    let event = state.event_service.get_event(sidequest.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_sidequest(event.visibility, event.phase, event.is_read_only) {
        return Err(ApiError::Forbidden {
            action: "edit this sidequest".to_string(),
        });
    }

    let sidequest = state
        .sidequest_service
        .update_sidequest(sidequest_id, body)
        .await?;

    Ok(Json(sidequest))
}

#[utoipa::path(
    delete,
    path = "/api/sidequests/{sidequest_id}",
    responses(
        (status = StatusCode::OK, body = ()),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn delete_sidequest(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(sidequest_id): Path<Uuid>,
) -> ApiJson<Sidequest> {
    let sidequest = state.sidequest_service.get_sidequest(sidequest_id).await?;
    let event = state.event_service.get_event(sidequest.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_sidequest(event.visibility, event.phase, event.is_read_only) {
        return Err(ApiError::Forbidden {
            action: "delete this sidequest".to_string(),
        });
    }

    state
        .sidequest_service
        .delete_sidequest(sidequest_id)
        .await?;

    Ok(Json(sidequest))
}
