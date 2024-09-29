pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::models::AffectedRowsDTO;
use crate::routers::events::models::EventIdQuery;
use crate::routers::teams::models::{TeamPasswordDTO, TeamProjectDTO};
use crate::routers::users::models::TeamRoleOptQuery;
use crate::ApiResult;
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, patch, post, put};
use axum::{Json, Router};
use repositories::db::prelude::TeamRole;
use services::authorization::model::TeamAffiliate;
use services::team::model::{ProjectPreferences, Team, TeamForCreate, TeamForUpdate};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(get_teams))
        .route("/", post(create_team))
        .route("/:event_slug/:team_slug", get(get_team_by_slug))
        .route("/:team_id", get(get_team))
        .route("/:team_id", patch(update_team))
        .route("/:team_id", delete(delete_team))
        .route("/:team_id/affiliates", get(get_team_affiliates))
        .route("/:team_id/roles", get(get_team_roles))
        .route("/:team_id/roles", put(put_team_roles))
        .route("/:team_id/roles", delete(delete_team_roles))
        .route("/:team_id/project", patch(update_team_project))
        .route(
            "/:team_id/project-preferences",
            get(get_team_project_preferences),
        )
        .route(
            "/:team_id/project-preferences",
            patch(update_team_project_preferences),
        )
        .route("/:team_id/password", get(get_team_password))
        .route("/:team_id/password", patch(update_team_password))
        .with_state(state.clone())
}

#[utoipa::path(
    get,
    path = "/api/teams",
    responses(
        (status = StatusCode::OK, body = Vec<Team>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id"= Uuid, Query, description = "Filter by event id"),
    )
)]
pub async fn get_teams(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
) -> ApiResult<Json<Vec<Team>>> {
    let event = state.event_service.get_event(query.event_id).await?;

    state
        .authorization_service
        .view_event_guard(ctx.roles(), event.id, event.visibility)?;

    let teams = state.team_service.get_teams(event.id).await?;

    Ok(Json(teams))
}

#[utoipa::path(
    post,
    path = "/api/teams",
    responses(
        (status = StatusCode::OK, body = Team),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn create_team(
    ctx: Ctx,
    State(state): State<ApiState>,
    Json(body): Json<TeamForCreate>,
) -> ApiResult<Json<Team>> {
    // TODO: authorization

    let team = state.team_service.create_team(ctx.user().id, body).await?;

    Ok(Json(team))
}

#[utoipa::path(
    get,
    path = "/api/teams/{event_slug}/{team_slug}",
    responses(
        (status = StatusCode::OK, body = Team),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_team_by_slug(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path((event_slug, team_slug)): Path<(String, String)>,
) -> ApiResult<Json<Team>> {
    let team = state
        .team_service
        .get_team_by_slug(&event_slug, &team_slug)
        .await?;

    let event = state.event_service.get_event(team.event_id).await?;

    state
        .authorization_service
        .view_event_guard(ctx.roles(), event.id, event.visibility)?;

    Ok(Json(team))
}

#[utoipa::path(
    get,
    path = "/api/teams/{team_id}",
    responses(
        (status = StatusCode::OK, body = Team),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_team(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiResult<Json<Team>> {
    let team = state.team_service.get_team(team_id).await?;

    let event = state.event_service.get_event(team.event_id).await?;

    state
        .authorization_service
        .view_event_guard(ctx.roles(), event.id, event.visibility)?;

    Ok(Json(team))
}

#[utoipa::path(
    patch,
    path = "/api/teams/{team_id}",
    responses(
        (status = StatusCode::OK, body = Appointment),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn update_team(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<TeamForUpdate>,
) -> ApiResult<Json<Team>> {
    let team = state.team_service.get_team(team_id).await?;

    // TODO: authorization

    let team = state.team_service.update_team(team_id, body).await?;

    Ok(Json(team))
}

#[utoipa::path(
    delete,
    path = "/api/teams/{team_id}",
    responses(
        (status = StatusCode::OK, body = Team),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn delete_team(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiResult<Json<Team>> {
    let team = state.team_service.get_team(team_id).await?;

    // TODO: authorization

    state.team_service.delete_team(team_id).await?;

    Ok(Json(team))
}

#[utoipa::path(
    get,
    path = "/api/teams/{team_id}/affiliates",
    responses(
        (status = StatusCode::OK, body = Vec<TeamAffiliate>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("role" = Option<TeamRole>, Query, description = "Filter by team role"),
    )
)]
pub async fn get_team_affiliates(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Query(query): Query<TeamRoleOptQuery>,
) -> ApiResult<Json<Vec<TeamAffiliate>>> {
    let team = state.team_service.get_team(team_id).await?;

    // TODO: authorization

    let affiliates = state
        .authorization_service
        .get_team_affiliates(team_id, query.role)
        .await?;

    Ok(Json(affiliates))
}

#[utoipa::path(
    get,
    path = "/api/teams/{team_id}/roles",
    responses(
        (status = StatusCode::OK, body = HashSet<TeamRole>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_team_roles(
    ctx: Ctx,
    Path(team_id): Path<Uuid>,
) -> ApiResult<Json<HashSet<TeamRole>>> {
    let roles = ctx.roles().team.get(&team_id).cloned().unwrap_or_default();

    Ok(Json(roles))
}

#[utoipa::path(
    put,
    path = "/api/teams/{team_id}/roles",
    responses(
        (status = StatusCode::OK, body = AffectedRowsDTO),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn put_team_roles(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<HashMap<Uuid, HashSet<TeamRole>>>,
) -> ApiResult<Json<AffectedRowsDTO>> {
    // TODO: authorization

    let affected_rows = state
        .authorization_service
        .assign_team_roles(team_id, body)
        .await?;

    let dto = AffectedRowsDTO { affected_rows };

    Ok(Json(dto))
}

#[utoipa::path(
    delete,
    path = "/api/teams/{team_id}/roles",
    responses(
        (status = StatusCode::OK, body = AffectedRowsDTO),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn delete_team_roles(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<HashMap<Uuid, HashSet<TeamRole>>>,
) -> ApiResult<Json<AffectedRowsDTO>> {
    // TODO: authorization

    let affected_rows = state
        .authorization_service
        .unassign_team_roles(team_id, body)
        .await?;

    let dto = AffectedRowsDTO { affected_rows };

    Ok(Json(dto))
}

#[utoipa::path(
    patch,
    path = "/api/teams/{team_id}/project",
    responses(
        (status = StatusCode::OK, body = Team),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn update_team_project(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<TeamProjectDTO>,
) -> ApiResult<Json<Team>> {
    let team = state.team_service.get_team(team_id).await?;

    // TODO: authorization

    let team = state
        .team_service
        .update_team_project(team_id, body.project_id)
        .await?;

    Ok(Json(team))
}

#[utoipa::path(
    get,
    path = "/api/teams/{team_id}/project-preferences",
    responses(
        (status = StatusCode::OK, body = ProjectPreferences),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_team_project_preferences(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiResult<Json<ProjectPreferences>> {
    let team = state.team_service.get_team(team_id).await?;

    // TODO: authorization

    let pps = state
        .team_service
        .get_team_project_preferences(team_id)
        .await?;

    Ok(Json(pps))
}

#[utoipa::path(
    patch,
    path = "/api/teams/{team_id}/project-preferences",
    responses(
        (status = StatusCode::OK, body = ProjectPreferences),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn update_team_project_preferences(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<ProjectPreferences>,
) -> ApiResult<Json<ProjectPreferences>> {
    let team = state.team_service.get_team(team_id).await?;

    // TODO: authorization

    let pps = state
        .team_service
        .update_team_project_preferences(team_id, body)
        .await?;

    Ok(Json(pps))
}

#[utoipa::path(
    get,
    path = "/api/teams/{team_id}/password",
    responses(
        (status = StatusCode::OK, body = TeamPasswordDTO),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_team_password(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiResult<Json<TeamPasswordDTO>> {
    let team = state.team_service.get_team(team_id).await?;

    // TODO: authorization

    let password = state.team_service.get_team_password(team_id).await?;
    let dto = TeamPasswordDTO { password };

    Ok(Json(dto))
}

#[utoipa::path(
    patch,
    path = "/api/teams/{team_id}/password",
    responses(
        (status = StatusCode::OK, body = Team),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn update_team_password(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<TeamPasswordDTO>,
) -> ApiResult<Json<Team>> {
    let team = state.team_service.get_team(team_id).await?;

    // TODO: authorization

    let team = state
        .team_service
        .update_team_password(team_id, body.password)
        .await?;

    Ok(Json(team))
}
