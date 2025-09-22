use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::ApiJson;
use crate::routers::users::models::PoliciesQuery;
use axum::extract::{Query, State};
use axum::routing::{get, patch};
use axum::{Json, Router};
use hackathon_portal_services::authorization::groups::Groups;
use hackathon_portal_services::authorization::policies::Policies;
use hackathon_portal_services::user::models::{User, UserForUpdate};

pub mod models;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/me", get(get_me))
        .route("/me", patch(update_me))
        .route("/me/policies", get(get_my_policies))
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

#[utoipa::path(
    get,
    path = "/api/users/me/policies",
    responses(
        (status = StatusCode::OK, body = Policies),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id" = Option<Uuid>, Query, description= "Get policies for this event"),
        ("team_id" = Option<Uuid>, Query, description= "Get policies for this team"),
    ),
)]
pub async fn get_my_policies(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<PoliciesQuery>,
) -> ApiJson<Policies> {
    query.validate()?;

    let (event, groups) = if let Some(event_id) = query.event_id {
        let event = state.event_service.get_event(event_id).await?;
        let groups = Groups::from_event(ctx.roles(), event.id);
        (event, groups)
    } else if let Some(team_id) = query.team_id {
        let team = state.team_service.get_team(team_id, false).await?;
        let event = state.event_service.get_event(team.event_id).await?;
        let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);
        (event, groups)
    } else {
        unreachable!("Query validation ensures exactly one of event_id or team_id is set")
    };

    let policies = Policies::new(
        &groups,
        event.visibility,
        event.phase,
        event.read_only,
        event.projects_visible,
        event.project_assignments_visible,
        event.feedback_visible,
    );

    Ok(Json(policies))
}
