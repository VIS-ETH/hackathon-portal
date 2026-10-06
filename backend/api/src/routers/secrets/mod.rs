use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::{ApiJson, ApiJsonVec};
use crate::routers::events::models::EventIdQuery;
use crate::ApiError;
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, post, put};
use axum::{Json, Router};
use hackathon_portal_services::authorization::groups::Groups;
use hackathon_portal_services::secret::models::{
    EventSecrets, Secret, SecretForCreate, SecretValue,
};
use std::collections::HashMap;
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(get_event_secrets))
        .route("/", post(create_secret))
        .route("/me", get(get_my_secrets))
        .route("/:secret_id", delete(delete_secret))
        .route("/:secret_id/values", put(update_secret_values))
        .with_state(state.clone())
}

#[utoipa::path(
    get,
    path = "/api/secrets",
    responses(
        (status = StatusCode::OK, body = EventSecrets),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id"= Uuid, Query, description = "Filter by event id"),
    )
)]
pub async fn get_event_secrets(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
) -> ApiJson<EventSecrets> {
    let event = state.event_service.get_event(query.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "view the secrets of this event".to_string(),
        });
    }

    let secrets = state.secret_service.get_event_secrets(event.id).await?;

    Ok(Json(secrets))
}

#[utoipa::path(
    post,
    path = "/api/secrets",
    responses(
        (status = StatusCode::OK, body = Secret),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn create_secret(
    ctx: Ctx,
    State(state): State<ApiState>,
    Json(body): Json<SecretForCreate>,
) -> ApiJson<Secret> {
    let event = state.event_service.get_event(body.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "create secrets for this event".to_string(),
        });
    }

    let secret = state.secret_service.create_secret(body).await?;

    Ok(Json(secret))
}

#[utoipa::path(
    get,
    path = "/api/secrets/me",
    responses(
        (status = StatusCode::OK, body = Vec<SecretValue>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id"= Uuid, Query, description = "Filter by event id"),
    )
)]
pub async fn get_my_secrets(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
) -> ApiJsonVec<SecretValue> {
    let event = state.event_service.get_event(query.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event_internal(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view your secrets in this event".to_string(),
        });
    }

    let secrets = state
        .secret_service
        .get_user_secrets(event.id, ctx.user().id)
        .await?;

    Ok(Json(secrets))
}

#[utoipa::path(
    delete,
    path = "/api/secrets/{secret_id}",
    responses(
        (status = StatusCode::OK, body = ()),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn delete_secret(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(secret_id): Path<Uuid>,
) -> ApiJson<()> {
    let event_id = state.secret_service.get_secret_event_id(secret_id).await?;
    let groups = Groups::from_event(ctx.roles(), event_id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "delete this secret".to_string(),
        });
    }

    state.secret_service.delete_secret(secret_id).await?;

    Ok(Json(()))
}

#[utoipa::path(
    put,
    path = "/api/secrets/{secret_id}/values",
    request_body = HashMap<Uuid, String>,
    responses(
        (status = StatusCode::OK, body = Secret),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn update_secret_values(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(secret_id): Path<Uuid>,
    Json(body): Json<HashMap<Uuid, String>>,
) -> ApiJson<Secret> {
    let event_id = state.secret_service.get_secret_event_id(secret_id).await?;
    let groups = Groups::from_event(ctx.roles(), event_id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "edit the values of this secret".to_string(),
        });
    }

    let secret = state
        .secret_service
        .update_secret_values(secret_id, body)
        .await?;

    Ok(Json(secret))
}
