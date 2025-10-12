pub mod models;
use axum::extract::{Path, State};

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::{ApiJson, ApiJsonVec};
use crate::routers::ratings::technical::models::SetTechnicalRating;
use crate::ApiError;
use axum::routing::{get, post};
use axum::{Json, Router};
use hackathon_portal_services::authorization::groups::Groups;
use hackathon_portal_services::rating::models::TechnicalQuestionResult;
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/:team_id", get(get_technical_team_rating))
        .route("/:team_id", post(set_technical_team_rating))
        .with_state(state.clone())
}

#[utoipa::path(
    get,
    path = "/api/ratings/technical/{team_id}",
    responses(
        (status = StatusCode::OK, body = Vec<TechnicalQuestionResult>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_technical_team_rating(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJsonVec<TechnicalQuestionResult> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "view technical rating".to_string(),
        });
    }

    let ratings = state.rating_service.get_technical_rating(team_id).await?;
    Ok(Json(ratings))
}

#[utoipa::path(
    post,
    path = "/api/ratings/technical/{team_id}",
    responses(
        (status = StatusCode::OK, body = TechnicalQuestionResult),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn set_technical_team_rating(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<SetTechnicalRating>,
) -> ApiJson<TechnicalQuestionResult> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "set a team rating".to_string(),
        });
    }

    let rating = state
        .rating_service
        .set_technical_rating(team_id, body.question_id, body.score)
        .await?;
    Ok(Json(rating))
}
