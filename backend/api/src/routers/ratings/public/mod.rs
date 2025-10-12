pub mod models;

use crate::{
    api_state::ApiState, ctx::Ctx, error::ApiJson, routers::events::models::EventIdQuery, ApiError,
};
use axum::{
    extract::{Path, Query, State},
    routing::{get, put},
    Json, Router,
};
use hackathon_portal_repositories::db::TeamRole;
use hackathon_portal_services::rating::models::Vote;
use hackathon_portal_services::{
    authorization::groups::Groups,
    rating::models::{PublicVote, PublicVoteAggregated},
};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(get_my_votes))
        .route("/", put(set_my_vote))
        .route("/:team_id", get(get_team_votes))
        .with_state(state.clone())
}

#[utoipa::path(
    get,
    path = "/api/ratings/public",
    responses(
        (status = StatusCode::OK, body = Vec<PublicVote>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id" = Uuid, Query, description = "Filter by event id"),
    )
)]
pub async fn get_my_votes(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
) -> ApiJson<Vec<PublicVote>> {
    let event = state.event_service.get_event(query.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_public_vote(event.visibility, event.vote_enabled, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "access votes for this event".to_string(),
        });
    }

    let votes = state
        .rating_service
        .get_public_vote_by_user(event.id, ctx.user().id)
        .await?;

    Ok(Json(votes))
}

#[utoipa::path(
    put,
    path = "/api/ratings/public",
    responses(
        (status = StatusCode::OK, body = Vote),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id" = Uuid, Query, description = "Chose event to vote in"),
    )
)]
pub async fn set_my_vote(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
    Json(vote): Json<Vote>,
) -> ApiJson<PublicVote> {
    let event = state.event_service.get_event(query.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_public_vote(event.visibility, event.vote_enabled, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "access votes for this event".to_string(),
        });
    }

    if vote.place < 1 || vote.place > 3 {
        return Err(ApiError::BadRequest {
            reason: "place must be between 1 and 3".to_string(),
        });
    }

    let finalists = state.team_service.get_finalists(event.id).await?;
    let team = state.team_service.get_team(vote.team_id).await?;

    if !finalists.contains(&team.id) {
        return Err(ApiError::Forbidden {
            action: "vote for a non-finalist team or team from different event".to_string(),
        });
    }

    if ctx
        .roles()
        .get_team_roles(&vote.team_id)
        .contains(&TeamRole::Member)
    {
        return Err(ApiError::Forbidden {
            action: "vote for your own team".to_string(),
        });
    }

    let votes = state
        .rating_service
        .set_public_vote(ctx.user().id, event.id, vote)
        .await?;
    Ok(Json(votes.into()))
}

#[utoipa::path(
    get,
    path = "/api/ratings/public/{team_id}",
    responses(
        (status = StatusCode::OK, body = PublicVoteAggregated),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_team_votes(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJson<PublicVoteAggregated> {
    let team = state.team_service.get_team(team_id).await?;
    let groups = Groups::from_event(ctx.roles(), team.event_id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "access votes for this event".to_string(),
        });
    }

    let votes = state
        .rating_service
        .get_public_votes_for_team_aggregated(team_id)
        .await?;

    Ok(Json(votes))
}
