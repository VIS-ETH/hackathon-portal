pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::{ApiJson, ApiJsonVec};
use crate::routers::teams::models::TeamIdQuery;
use crate::ApiError;
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use hackathon_portal_services::authorization::groups::Groups;
use hackathon_portal_services::rating::models::{
    ExpertRating, ExpertRatingForCreate, ExpertRatingForUpdate,
};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", post(create_expert_rating))
        .route("/", get(get_expert_ratings))
        .route("/:rating_id", get(get_expert_rating))
        .route("/:rating_id", patch(update_expert_rating))
        .route("/:rating_id", delete(delete_expert_rating))
        .with_state(state.clone())
}

#[utoipa::path(
    post,
    path = "/api/expert-ratings",
    responses(
        (status = StatusCode::OK, body = ExpertRating),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn create_expert_rating(
    ctx: Ctx,
    State(state): State<ApiState>,
    Json(body): Json<ExpertRatingForCreate>,
) -> ApiJson<ExpertRating> {
    let team = state.team_service.get_team(body.team_id, false).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_expert_rating(event.visibility, event.phase, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "create an expert rating for this event".to_string(),
        });
    }

    let rating = state
        .rating_service
        .create_expert_rating(ctx.user().id, body)
        .await?;

    Ok(Json(rating))
}

#[utoipa::path(
    get,
    path = "/api/expert-ratings",
    responses(
        (status = StatusCode::OK, body = Vec<ExpertRating>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("team_id" = Uuid, Query, description = "Filter by team id"),
    )
)]
pub async fn get_expert_ratings(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<TeamIdQuery>,
) -> ApiJsonVec<ExpertRating> {
    let team = state.team_service.get_team(query.team_id, false).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_expert_rating(event.visibility, event.phase, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "view expert ratings for this event".to_string(),
        });
    }

    let ratings = state
        .rating_service
        .get_expert_ratings(query.team_id)
        .await?;

    let ratings = ratings
        .into_iter()
        .filter(|rating| groups.can_manage_event() || rating.user_id == ctx.user().id)
        .collect();

    Ok(Json(ratings))
}

#[utoipa::path(
    get,
    path = "/api/expert-ratings/{rating_id}",
    responses(
        (status = StatusCode::OK, body = ExpertRating),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_expert_rating(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(rating_id): Path<Uuid>,
) -> ApiJson<ExpertRating> {
    // TODO: think about joins...
    let rating = state.rating_service.get_expert_rating(rating_id).await?;
    let team = state.team_service.get_team(rating.team_id, false).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    let user_policy_pass = rating.user_id == ctx.user().id || groups.can_manage_event();
    let rating_policy_pass =
        groups.can_manage_expert_rating(event.visibility, event.phase, event.read_only);

    if !user_policy_pass || !rating_policy_pass {
        return Err(ApiError::Forbidden {
            action: "view this expert rating".to_string(),
        });
    }

    Ok(Json(rating))
}

#[utoipa::path(
    patch,
    path = "/api/expert-ratings/{rating_id}",
    responses(
        (status = StatusCode::OK, body = ExpertRating),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn update_expert_rating(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(rating_id): Path<Uuid>,
    Json(body): Json<ExpertRatingForUpdate>,
) -> ApiJson<ExpertRating> {
    let rating = state.rating_service.get_expert_rating(rating_id).await?;

    let team = state.team_service.get_team(rating.team_id, false).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    let user_policy_pass = rating.user_id == ctx.user().id || groups.can_manage_event();
    let rating_policy_pass =
        groups.can_manage_expert_rating(event.visibility, event.phase, event.read_only);

    if !user_policy_pass || !rating_policy_pass {
        return Err(ApiError::Forbidden {
            action: "update this expert rating".to_string(),
        });
    }

    let rating = state
        .rating_service
        .update_expert_rating(rating_id, body)
        .await?;

    Ok(Json(rating))
}

#[utoipa::path(
    delete,
    path = "/api/expert-ratings/{rating_id}",
    responses(
        (status = StatusCode::OK, body = ExpertRating),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn delete_expert_rating(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(rating_id): Path<Uuid>,
) -> ApiJson<ExpertRating> {
    let rating = state.rating_service.get_expert_rating(rating_id).await?;

    let team = state.team_service.get_team(rating.team_id, false).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    let user_policy_pass = rating.user_id == ctx.user().id || groups.can_manage_event();
    let rating_policy_pass =
        groups.can_manage_expert_rating(event.visibility, event.phase, event.read_only);

    if !user_policy_pass || !rating_policy_pass {
        return Err(ApiError::Forbidden {
            action: "delete this expert rating".to_string(),
        });
    }

    state.rating_service.delete_expert_rating(rating_id).await?;

    Ok(Json(rating))
}
