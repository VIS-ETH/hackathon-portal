pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::models::AffectedRowsDTO;
use crate::routers::sidequests::models::SidequestDTO;
use crate::{ApiError, ApiResult};
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, patch, post, put};
use axum::{Json, Router};
use models::CreateSidequestDTO;
use repositories::db::prelude::EventRole;
use serde::Deserialize;
use services::authorization;
use services::event::model::EventForPatch;
use services::sidequest::model::{
    AttemptForCreate, SidequestEntryForLeaderboard, SidequestForCreate, SidequestForPatch,
};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

use super::events::models::EventIdQuery;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(get_sidequests))
        .route("/", post(post_sidequests))
        .route("/:sidequest_id", patch(patch_sidequests))
        .route("/:sidequest_id/attempts", post(post_sidequests_attempts))
        .route("/:sidequest_id/leaderboard", get(get_leaderboard))
        // .route("/:event_id", patch(patch_event))
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
    let _ = state
        .authorization_service
        .edit_sidequests_attempt_guard(ctx.roles(), event.id)?;

    let res = state.authorization_service.get_event_roles(body.user_id).await?;
    let roles = res.get(&event.id).ok_or((ApiError::Forbidden{action: "participate".to_string(),resource:"sidequests".to_string(), id: sidequest_id.to_string()}))?;
    if (!roles.contains(&EventRole::Participant)) {
        return Err((ApiError::Forbidden{action: "participate".to_string()
        ,resource:"sidequests".to_string(), id: sidequest_id.to_string()}))
    }

    let _ = state
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
        (status = StatusCode::OK, body = Vec<SidequestEntryForLeaderboard>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_leaderboard(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(sidequest_id): Path<Uuid>,
) -> ApiResult<Json<Vec<SidequestEntryForLeaderboard>>> {
    let event = state.sidequest_service.get_event(sidequest_id).await?;
    let _ =
        state
            .authorization_service
            .view_event_guard(ctx.roles(), event.id, event.visibility)?;
    let leaderboard: Vec<SidequestEntryForLeaderboard> = state
        .sidequest_service
        .get_leaderboard(sidequest_id)
        .await?;
    Ok(Json(leaderboard))
}

// #[utoipa::path(
//     post,
//     path = "/api/events/{event_id}/invite",
//     responses(
//         (status = StatusCode::OK, body = AffectedRowsDTO),
//         (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
//     )
// )]
// pub async fn invite_users(
//     ctx: Ctx,
//     State(state): State<ApiState>,
//     Path(event_id): Path<Uuid>,
//     Json(body): Json<InviteUsersDTO>,
// ) -> ApiResult<Json<AffectedRowsDTO>> {
//     state
//         .authorization_service
//         .edit_event_guard(ctx.roles(), event_id)?;

//     let auth_ids = body
//         .users
//         .iter()
//         .map(|user| user.auth_id.clone())
//         .collect::<Vec<_>>();
//     let roles = body.default_roles.iter().cloned().collect::<HashSet<_>>();

//     let affected_rows = state.user_service.create_users(body.users).await?;
//     let _ = state
//         .authorization_service
//         .assign_default_event_roles(event_id, auth_ids, roles)
//         .await?;

//     let dto = AffectedRowsDTO { affected_rows };

//     Ok(Json(dto))
// }

// #[utoipa::path(
//     get,
//     path = "/api/events/{event_id}",
//     responses(
//         (status = StatusCode::OK, body = GetEventResponse),
//         (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
//     )
// )]
// pub async fn get_event(
//     ctx: Ctx,
//     State(state): State<ApiState>,
//     Path(event_id): Path<Uuid>,
// ) -> ApiResult<Json<EventDTO>> {
//     let event = state.event_service.get_event(event_id).await?;

//     state
//         .authorization_service
//         .view_event_guard(ctx.roles(), event.id, event.visibility)?;

//     let dto = EventDTO::from(event);

//     Ok(Json(dto))
// }

// #[utoipa::path(
//     patch,
//     path = "/api/events/{event_id}",
//     responses(
//         (status = StatusCode::OK, body = GetEventResponse),
//         (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
//     )
// )]
// pub async fn patch_event(
//     ctx: Ctx,
//     State(state): State<ApiState>,
//     Path(event_id): Path<Uuid>,
//     Json(body): Json<EventForPatch>,
// ) -> ApiResult<Json<EventDTO>> {
//     state
//         .authorization_service
//         .edit_event_guard(ctx.roles(), event_id)?;

//     let event = state.event_service.patch_event(event_id, &body).await?;

//     let dto = EventDTO::from(event);

//     Ok(Json(dto))
// }

// #[utoipa::path(
//     get,
//     path = "/api/events/roles",
//     responses(
//         (status = StatusCode::OK, body = HashMap<Uuid, HashSet<EventRole>>),
//         (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
//     )
// )]
// pub async fn get_events_roles(ctx: Ctx) -> ApiResult<Json<HashMap<Uuid, HashSet<EventRole>>>> {
//     let dto = ctx.roles().event.clone();
//     Ok(Json(dto))
// }

// #[utoipa::path(
//     get,
//     path = "/api/events/{event_id}/roles",
//     responses(
//         (status = StatusCode::OK, body = HashSet<EventRole>),
//         (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
//     )
// )]
// pub async fn get_event_roles(
//     ctx: Ctx,
//     Path(event_id): Path<Uuid>,
// ) -> ApiResult<Json<HashSet<EventRole>>> {
//     let dto = ctx
//         .roles()
//         .event
//         .get(&event_id)
//         .cloned()
//         .unwrap_or_default();
//     Ok(Json(dto))
// }

// #[utoipa::path(
//     put,
//     path = "/api/events/{event_id}/roles",
//     responses(
//         (status = StatusCode::OK, body = AffectedRowsDTO),
//         (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
//     )
// )]
// pub async fn put_event_roles(
//     ctx: Ctx,
//     State(state): State<ApiState>,
//     Path(event_id): Path<Uuid>,
//     Json(body): Json<HashMap<Uuid, HashSet<EventRole>>>,
// ) -> ApiResult<Json<AffectedRowsDTO>> {
//     state
//         .authorization_service
//         .edit_event_guard(ctx.roles(), event_id)?;

//     let affected_rows = state
//         .authorization_service
//         .assign_event_roles(event_id, body)
//         .await?;

//     let dto = AffectedRowsDTO { affected_rows };

//     Ok(Json(dto))
// }

// #[utoipa::path(
//     delete,
//     path = "/api/events/{event_id}/roles",
//     responses(
//         (status = StatusCode::OK, body = AffectedRowsDTO),
//         (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
//     )
// )]
// pub async fn delete_event_roles(
//     ctx: Ctx,
//     State(state): State<ApiState>,
//     Path(event_id): Path<Uuid>,
//     Json(body): Json<HashMap<Uuid, HashSet<EventRole>>>,
// ) -> ApiResult<Json<AffectedRowsDTO>> {
//     state
//         .authorization_service
//         .edit_event_guard(ctx.roles(), event_id)?;

//     // Prevent admins from unassigning themselves
//     if body
//         .get(&ctx.user().id)
//         .is_some_and(|roles| roles.contains(&EventRole::Admin))
//     {
//         return Err(ApiError::Forbidden {
//             resource: "event".to_string(),
//             id: event_id.to_string(),
//             action: "unassign self".to_string(),
//         });
//     }

//     let affected_rows = state
//         .authorization_service
//         .unassign_event_roles(event_id, body)
//         .await?;

//     let dto = AffectedRowsDTO { affected_rows };

//     Ok(Json(dto))
// }
