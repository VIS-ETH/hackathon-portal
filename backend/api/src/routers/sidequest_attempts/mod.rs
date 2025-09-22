pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::{ApiJson, ApiJsonVec};
use crate::routers::sidequest_attempts::models::{
    SidequestAttemptsCooldownQuery, SidequestAttemptsQuery,
};
use crate::ApiError;
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use hackathon_portal_services::authorization::groups::Groups;
use hackathon_portal_services::sidequest::models::{
    Attempt, AttemptForCreate, AttemptForUpdate, Cooldown,
};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", post(create_sidequest_attempt))
        .route("/", get(get_sidequest_attempts))
        .route("/cooldown", get(get_sidequest_attempt_cooldown))
        .route("/:sidequest_attempt_id", get(get_sidequest_attempt))
        .route("/:sidequest_attempt_id", patch(update_sidequest_attempt))
        .route("/:sidequest_attempt_id", delete(delete_sidequest_attempt))
        .with_state(state.clone())
}

#[utoipa::path(
    post,
    path = "/api/sidequest-attempts",
    responses(
        (status = StatusCode::OK, body = Attempt),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn create_sidequest_attempt(
    ctx: Ctx,
    State(state): State<ApiState>,
    Json(body): Json<AttemptForCreate>,
) -> ApiJson<Attempt> {
    let sidequest = state
        .sidequest_service
        .get_sidequest(body.sidequest_id)
        .await?;
    let event = state.event_service.get_event(sidequest.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_sidequest_attempt(event.visibility, event.phase, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "create a sidequest for this event".to_string(),
        });
    }

    let attempt = state.sidequest_service.create_attempt(body).await?;

    Ok(Json(attempt))
}

#[utoipa::path(
    get,
    path = "/api/sidequest-attempts",
    responses(
        (status = StatusCode::OK, body = Vec<Attempt>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id" = Uuid, Query, description= "Filter by event ID"),
        ("sidequest_id" = Option<Uuid>, Query, description= "Filter by sidequest ID"),
        ("team_id" = Option<Uuid>, Query, description= "Filter by team ID"),
        ("user_id" = Option<Uuid>, Query, description= "Filter by user ID"),
        ("after" = Option<NaiveDateTime>, Query, description= "Filter by attempts after this time"),
        ("before" = Option<NaiveDateTime>, Query, description= "Filter by attempts before this time"),
    )
)]
pub async fn get_sidequest_attempts(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<SidequestAttemptsQuery>,
) -> ApiJsonVec<Attempt> {
    query.validate()?;

    let event = state.event_service.get_event(query.event_id).await?;
    let event_groups = Groups::from_event(ctx.roles(), event.id);

    let attempts = if let Some(sidequest_id) = query.sidequest_id {
        if !event_groups.can_view_sidequest_attempt(event.visibility) {
            return Err(ApiError::Forbidden {
                action: "view sidequest attempts for this event".to_string(),
            });
        }

        state
            .sidequest_service
            .get_attempts_by_sidequest(sidequest_id, query.after, query.before)
            .await?
    } else if let Some(team_id) = query.team_id {
        let team_groups = Groups::from_event_and_team(ctx.roles(), event.id, team_id);

        if !team_groups.can_view_team_confidential(event.visibility)
            && !event_groups.can_view_sidequest_attempt(event.visibility)
        {
            return Err(ApiError::Forbidden {
                action: "view sidequest attempts for this event".to_string(),
            });
        }

        state
            .sidequest_service
            .get_attempts_by_team(team_id, query.after, query.before)
            .await?
    } else if let Some(user_id) = query.user_id {
        if user_id != ctx.user().id && !event_groups.can_view_event(event.visibility) {
            return Err(ApiError::Forbidden {
                action: "view sidequest attempts for this event".to_string(),
            });
        }

        state
            .sidequest_service
            .get_attempts_by_user(user_id, event.id, query.after, query.before)
            .await?
    } else {
        if !event_groups.can_view_sidequest_attempt(event.visibility) {
            return Err(ApiError::Forbidden {
                action: "view sidequest attempts for this event".to_string(),
            });
        }

        state
            .sidequest_service
            .get_attempts(event.id, query.after, query.before)
            .await?
    };

    Ok(Json(attempts))
}

#[utoipa::path(
    get,
    path = "/api/sidequest-attempts/cooldown",
    responses(
        (status = StatusCode::OK, body = Cooldown),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id"= Uuid, Query, description= "Filter by event ID"),
        ("user_id"= Option<Uuid>, Query, description= "Filter by user ID. Leave empty to use the current user."),
    )
)]
pub async fn get_sidequest_attempt_cooldown(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<SidequestAttemptsCooldownQuery>,
) -> ApiJson<Cooldown> {
    let event = state.event_service.get_event(query.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    let user_id = if let Some(user_id) = query.user_id {
        if user_id != ctx.user().id && !groups.can_view_sidequest_attempt(event.visibility) {
            return Err(ApiError::Forbidden {
                action: "view sidequest attempts for this event".to_string(),
            });
        }

        user_id
    } else {
        ctx.user().id
    };

    let cooldown = state
        .sidequest_service
        .get_cooldown(user_id, event.id)
        .await?;

    Ok(Json(cooldown))
}

#[utoipa::path(
    get,
    path = "/api/sidequest-attempts/{sidequest_attempt_id}",
    responses(
        (status = StatusCode::OK, body = Attempt),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_sidequest_attempt(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(sidequest_attempt_id): Path<Uuid>,
) -> ApiJson<Attempt> {
    let attempt = state
        .sidequest_service
        .get_attempt(sidequest_attempt_id)
        .await?;
    let sidequest = state
        .sidequest_service
        .get_sidequest(attempt.sidequest_id)
        .await?;
    let event = state.event_service.get_event(sidequest.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_sidequest_attempt(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view sidequest attempts for this event".to_string(),
        });
    }

    Ok(Json(attempt))
}

#[utoipa::path(
    patch,
    path = "/api/sidequest-attempts/{sidequest_attempt_id}",
    responses(
        (status = StatusCode::OK, body = Attempt),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn update_sidequest_attempt(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(sidequest_attempt_id): Path<Uuid>,
    Json(body): Json<AttemptForUpdate>,
) -> ApiJson<Attempt> {
    let attempt = state
        .sidequest_service
        .get_attempt(sidequest_attempt_id)
        .await?;
    let sidequest = state
        .sidequest_service
        .get_sidequest(attempt.sidequest_id)
        .await?;
    let event = state.event_service.get_event(sidequest.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_sidequest_attempt(event.visibility, event.phase, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "update a sidequest attempt for this event".to_string(),
        });
    }

    let attempt = state
        .sidequest_service
        .update_attempt(sidequest_attempt_id, body)
        .await?;

    Ok(Json(attempt))
}

#[utoipa::path(
    delete,
    path = "/api/sidequest-attempts/{sidequest_attempt_id}",
    responses(
        (status = StatusCode::OK, body = ()),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn delete_sidequest_attempt(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(sidequest_attempt_id): Path<Uuid>,
) -> ApiJson<()> {
    let attempt = state
        .sidequest_service
        .get_attempt(sidequest_attempt_id)
        .await?;
    let sidequest = state
        .sidequest_service
        .get_sidequest(attempt.sidequest_id)
        .await?;
    let event = state.event_service.get_event(sidequest.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_sidequest_attempt(event.visibility, event.phase, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "delete a sidequest attempt for this event".to_string(),
        });
    }

    state
        .sidequest_service
        .delete_attempt(sidequest_attempt_id)
        .await?;

    Ok(Json(()))
}
