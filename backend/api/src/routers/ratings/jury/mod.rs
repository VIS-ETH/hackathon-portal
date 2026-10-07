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
    JuryRating, JuryRatingForCreate, JuryRatingForUpdate,
};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", post(create_jury_rating))
        .route("/", get(get_jury_ratings))
        .route("/:rating_id", get(get_jury_rating))
        .route("/:rating_id", patch(update_jury_rating))
        .route("/:rating_id", delete(delete_jury_rating))
        .with_state(state.clone())
}

#[utoipa::path(
    post,
    path = "/api/ratings/jury",
    responses(
        (status = StatusCode::OK, body = JuryRating),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn create_jury_rating(
    ctx: Ctx,
    State(state): State<ApiState>,
    Json(body): Json<JuryRatingForCreate>,
) -> ApiJson<JuryRating> {
    let (_, event) = state.team_service.get_team_with_event(body.team_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_jury_rating(
        event.visibility,
        event.phase,
        event.jury_rating_open,
        event.read_only,
    ) {
        return Err(ApiError::Forbidden {
            action: "create a jury rating for this event".to_string(),
        });
    }

    let rating = state
        .rating_service
        .create_jury_rating(ctx.user().id, body)
        .await?;

    Ok(Json(rating))
}

#[utoipa::path(
    get,
    path = "/api/ratings/jury",
    responses(
        (status = StatusCode::OK, body = Vec<JuryRating>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("team_id" = Uuid, Query, description = "Filter by team id"),
    )
)]
pub async fn get_jury_ratings(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<TeamIdQuery>,
) -> ApiJsonVec<JuryRating> {
    let (_, event) = state
        .team_service
        .get_team_with_event(query.team_id)
        .await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_jury_rating(
        event.visibility,
        event.phase,
        event.jury_rating_open,
        event.read_only,
    ) {
        return Err(ApiError::Forbidden {
            action: "view jury ratings for this event".to_string(),
        });
    }

    let ratings = state.rating_service.get_jury_ratings(query.team_id).await?;

    let ratings = ratings
        .into_iter()
        .filter(|rating| groups.can_manage_event() || rating.user_id == ctx.user().id)
        .collect();

    Ok(Json(ratings))
}

#[utoipa::path(
    get,
    path = "/api/ratings/jury/{rating_id}",
    responses(
        (status = StatusCode::OK, body = JuryRating),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_jury_rating(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(rating_id): Path<Uuid>,
) -> ApiJson<JuryRating> {
    let (rating, event) = state
        .rating_service
        .get_jury_rating_with_event(rating_id)
        .await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    let user_policy_pass = rating.user_id == ctx.user().id || groups.can_manage_event();
    let rating_policy_pass = groups.can_manage_jury_rating(
        event.visibility,
        event.phase,
        event.jury_rating_open,
        event.read_only,
    );

    if !user_policy_pass || !rating_policy_pass {
        return Err(ApiError::Forbidden {
            action: "view this jury rating".to_string(),
        });
    }

    Ok(Json(rating))
}

#[utoipa::path(
    patch,
    path = "/api/ratings/jury/{rating_id}",
    responses(
        (status = StatusCode::OK, body = JuryRating),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn update_jury_rating(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(rating_id): Path<Uuid>,
    Json(body): Json<JuryRatingForUpdate>,
) -> ApiJson<JuryRating> {
    let (rating, event) = state
        .rating_service
        .get_jury_rating_with_event(rating_id)
        .await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    let user_policy_pass = rating.user_id == ctx.user().id || groups.can_manage_event();
    let rating_policy_pass = groups.can_manage_jury_rating(
        event.visibility,
        event.phase,
        event.jury_rating_open,
        event.read_only,
    );

    if !user_policy_pass || !rating_policy_pass {
        return Err(ApiError::Forbidden {
            action: "update this jury rating".to_string(),
        });
    }

    let rating = state
        .rating_service
        .update_jury_rating(rating_id, body)
        .await?;

    Ok(Json(rating))
}

#[utoipa::path(
    delete,
    path = "/api/ratings/jury/{rating_id}",
    responses(
        (status = StatusCode::OK, body = JuryRating),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn delete_jury_rating(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(rating_id): Path<Uuid>,
) -> ApiJson<JuryRating> {
    let (rating, event) = state
        .rating_service
        .get_jury_rating_with_event(rating_id)
        .await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    let user_policy_pass = rating.user_id == ctx.user().id || groups.can_manage_event();
    let rating_policy_pass = groups.can_manage_jury_rating(
        event.visibility,
        event.phase,
        event.jury_rating_open,
        event.read_only,
    );

    if !user_policy_pass || !rating_policy_pass {
        return Err(ApiError::Forbidden {
            action: "delete this jury rating".to_string(),
        });
    }

    state.rating_service.delete_jury_rating(rating_id).await?;

    Ok(Json(rating))
}
