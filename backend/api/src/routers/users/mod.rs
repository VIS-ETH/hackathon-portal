use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::ApiJson;
use axum::extract::State;
use axum::routing::{get, patch};
use axum::{Json, Router};
use services::user::models::{User, UserForUpdate};

pub mod models;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/me", get(get_me))
        .route("/me", patch(update_me))
        .with_state(state.clone())
}

#[utoipa::path(
    get,
    path = "/api/users/me",
    responses(
        (status = StatusCode::OK, body = User),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_me(ctx: Ctx) -> ApiJson<User> {
    let me = ctx.user().clone();
    Ok(Json(me))
}

#[utoipa::path(
    patch,
    path = "/api/users/me",
    responses(
        (status = StatusCode::OK, body = User),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn update_me(
    ctx: Ctx,
    State(state): State<ApiState>,
    Json(body): Json<UserForUpdate>,
) -> ApiJson<User> {
    let me = state.user_service.update_user(ctx.user().id, body).await?;
    Ok(Json(me))
}
