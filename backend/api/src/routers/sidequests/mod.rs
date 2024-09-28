pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::routers::sidequests::models::SidequestDTO;
use crate::{ApiError, ApiResult};
use axum::extract::{Path, Query, State};
use axum::routing::{get, patch, post};
use axum::{Json, Router};
use models::CreateSidequestDTO;
use repositories::db::prelude::EventRole;
use services::sidequest::model::{
    AttemptForCreate, FullInfoSidequestEntryForLeaderboard, FullInfoTeamEntryForLeaderboard,
    SidequestForCreate, SidequestForPatch, TimelineData,
};
use uuid::Uuid;

use super::events::models::{EventIdQuery, EventLeaderboardTimelineQuery};

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(get_sidequests))
        .route("/", post(post_sidequests))
        .route("/:sidequest_id", patch(patch_sidequests))
        .route("/:sidequest_id/attempts", post(post_sidequests_attempts))
        .route("/:sidequest_id/leaderboard", get(get_leaderboard))
        .route("/leaderboard", get(get_team_leaderboard))
        .route("/leaderboard/timeline", get(get_leaderboard_timeline))
        // .route("/:event_id/roles", get(get_event_roles))
        // .route("/:event_id/roles", put(put_event_roles))
        // .route("/:event_id/roles", delete(delete_event_roles))
        // .route("/:event_id/invite", post(invite_users))
        .with_state(state.clone())
}

#[utoipa::path(
    get,
    path = "/api/sidequests",
    responses(
        (status = StatusCode::OK, body = Vec<SidequestDTO>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id"= Uuid, Query, description= "The ID of the event to get sidequests for"),
    )
)]
pub async fn get_sidequests(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
) -> ApiResult<Json<Vec<SidequestDTO>>> {
    let event = state.event_service.get_event(query.event_id).await?;

    state
        .authorization_service
        .view_event_guard(ctx.roles(), event.id, event.visibility)?;

    let sidequests = state.sidequest_service.get_sidequests(event.id).await?;

    let dto = sidequests.into_iter().map(SidequestDTO::from).collect();

    Ok(Json(dto))
}

#[utoipa::path(
    post,
    path = "/api/sidequests",
    responses(
        (status = StatusCode::OK, body = u64),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn post_sidequests(
    ctx: Ctx,
    State(state): State<ApiState>,
    Json(body): Json<CreateSidequestDTO>,
) -> ApiResult<Json<u64>> {
    state
        .authorization_service
        .edit_sidequests_guard(ctx.roles(), body.event_id)?;

    let num_created = state
        .sidequest_service
        .create_sidequest(SidequestForCreate {
            description: body.description.clone(),
            event_id: body.event_id,
            is_higher_result_better: body.is_higher_result_better,
            name: body.name.clone(),
        })
        .await?;

    Ok(Json(num_created))
}

#[utoipa::path(
    patch,
    path = "/api/sidequests/{sidequest_id}",
    responses(
        (status = StatusCode::OK, body = SidequestDTO),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn patch_sidequests(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(sidequest_id): Path<Uuid>,
    Json(body): Json<SidequestForPatch>,
) -> ApiResult<Json<SidequestDTO>> {
    state
        .authorization_service
        .edit_sidequests_guard(ctx.roles(), body.event_id)?;

    let result = state
        .sidequest_service
        .patch_sidequest(sidequest_id, body)
        .await?;

    Ok(Json(result.into()))
}

#[utoipa::path(
    post,
    path = "/api/sidequests/{sidequest_id}/attempts",
    responses(
        (status = StatusCode::OK, body = u64),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn post_sidequests_attempts(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(sidequest_id): Path<Uuid>,
    Json(body): Json<AttemptForCreate>,
) -> ApiResult<Json<u64>> {
    let event = state.sidequest_service.get_event(sidequest_id).await?;
    state
        .authorization_service
        .edit_sidequests_attempt_guard(ctx.roles(), event.id)?;

    let res = state
        .authorization_service
        .get_event_roles(body.user_id)
        .await?;
    let roles = res.get(&event.id).ok_or(ApiError::Forbidden {
        action: "participate".to_string(),
        resource: "sidequests".to_string(),
        id: sidequest_id.to_string(),
    })?;
    if !roles.contains(&EventRole::Participant) {
        return Err(ApiError::Forbidden {
            action: "participate".to_string(),
            resource: "sidequests".to_string(),
            id: sidequest_id.to_string(),
        });
    }

    state
        .authorization_service
        .allowed_attempt(body.user_id, event.id)
        .await?;
    let result = state
        .sidequest_service
        .add_attempt(sidequest_id, body)
        .await?;
    Ok(Json(result))
}

#[utoipa::path(
    get,
    path = "/api/sidequests/{sidequest_id}/leaderboard",
    responses(
        (status = StatusCode::OK, body = Vec<FullInfoSidequestEntryForLeaderboard>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_leaderboard(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(sidequest_id): Path<Uuid>,
) -> ApiResult<Json<Vec<FullInfoSidequestEntryForLeaderboard>>> {
    let event = state.sidequest_service.get_event(sidequest_id).await?;
    state
        .authorization_service
        .view_event_guard(ctx.roles(), event.id, event.visibility)?;
    let leaderboard = state
        .sidequest_service
        .get_full_leaderboard(sidequest_id)
        .await?;
    Ok(Json(leaderboard))
}

#[utoipa::path(
    get,
    path = "/api/sidequests/leaderboard",
    responses(
        (status = StatusCode::OK, body = Vec<FullInfoTeamEntryForLeaderboard>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params (
        ("event_id" = Uuid, Query, description = "The Event ID to get the leaderboard for"),
    )
)]
pub async fn get_team_leaderboard(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
) -> ApiResult<Json<Vec<FullInfoTeamEntryForLeaderboard>>> {
    let event = state.event_service.get_event(query.event_id).await?;
    state
        .authorization_service
        .view_event_guard(ctx.roles(), event.id, event.visibility)?;
    let leaderboard = state
        .sidequest_service
        .get_team_leaderboard(event.id)
        .await?;
    Ok(Json(leaderboard))
}

#[utoipa::path(
    get,
    path = "/api/sidequests/leaderboard/timeline",
    responses(
        (status = StatusCode::OK, body = TimelineData),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params (
        ("event_id" = Uuid, Query, description = "The Event ID to get the leaderboard for"),
        ("before" = Option<NaiveDateTime>, Query, description = "Only return entries before this time"),
        ("after" = Option<NaiveDateTime>, Query, description = "Only return entries after this time"),
    )
)]
pub async fn get_leaderboard_timeline(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventLeaderboardTimelineQuery>,
) -> ApiResult<Json<TimelineData>> {
    let event = state.event_service.get_event(query.event_id).await?;
    state
        .authorization_service
        .view_event_guard(ctx.roles(), event.id, event.visibility)?;
    let leaderboard = state
        .sidequest_service
        .get_timeline(event.id, query.before, query.after)
        .await?;
    Ok(Json(leaderboard))
}
