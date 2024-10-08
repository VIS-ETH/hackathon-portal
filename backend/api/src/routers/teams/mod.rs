pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::{ApiJson, ApiJsonVec};
use crate::models::AffectedRows;
use crate::routers::events::models::EventIdQuery;
use crate::routers::teams::models::{PasswordDTO, ProjectIdDTO};
use crate::routers::users::models::TeamRoleOptQuery;
use crate::ApiError;
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, patch, post, put};
use axum::{Json, Router};
use repositories::db::prelude::TeamRole;
use services::authorization::groups::Groups;
use services::authorization::models::{TeamAffiliate, TeamRoles, TeamRolesMap};
use services::team::models::{ProjectPreferences, Team, TeamForCreate, TeamForUpdate};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", post(create_team))
        .route("/", get(get_teams))
        .route("/roles", get(get_teams_roles))
        .route("/slug/:event_slug/:team_slug", get(get_team_by_slug))
        .route("/:team_id", get(get_team))
        .route("/:team_id", patch(update_team))
        .route("/:team_id", delete(delete_team))
        .route("/:team_id/roles", get(get_team_roles))
        .route("/:team_id/roles", put(put_team_roles))
        .route("/:team_id/roles", delete(delete_team_roles))
        .route("/:team_id/affiliates", get(get_team_affiliates))
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
) -> ApiJson<Team> {
    let event = state.event_service.get_event(body.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_create_team(event.visibility, event.phase, event.is_read_only) {
        return Err(ApiError::Forbidden {
            action: "create a team for this event".to_string(),
        });
    }

    let team = state.team_service.create_team(ctx.user().id, body).await?;

    Ok(Json(team))
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
) -> ApiJsonVec<Team> {
    let event = state.event_service.get_event(query.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view teams for this event".to_string(),
        });
    }

    let teams = state.team_service.get_teams(event.id).await?;

    Ok(Json(teams))
}

#[utoipa::path(
    get,
    path = "/api/teams/roles",
    responses(
        (status = StatusCode::OK, body = HashMap<Uuid, HashSet<TeamRole>>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id"= Uuid, Query, description = "Filter by event id"),
    )
)]
pub async fn get_teams_roles(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
) -> ApiJson<TeamRolesMap> {
    let event = state.event_service.get_event(query.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view team roles for this event".to_string(),
        });
    }

    let mut roles = HashMap::new();
    let all_roles = ctx.roles().team.clone();

    // TODO: inefficient
    let teams = state.team_service.get_teams(event.id).await?;

    for team in teams {
        if let Some(team_roles) = all_roles.get(&team.id) {
            roles.insert(team.id, team_roles.clone());
        }
    }

    Ok(Json(roles))
}

#[utoipa::path(
    get,
    path = "/api/teams/slug/{event_slug}/{team_slug}",
    responses(
        (status = StatusCode::OK, body = Team),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_team_by_slug(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path((event_slug, team_slug)): Path<(String, String)>,
) -> ApiJson<Team> {
    let team = state
        .team_service
        .get_team_by_slug(&event_slug, &team_slug)
        .await?;

    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view this team".to_string(),
        });
    }

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
) -> ApiJson<Team> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view this team".to_string(),
        });
    }

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
) -> ApiJson<Team> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_manage_team(event.visibility, event.phase, event.is_read_only) {
        return Err(ApiError::Forbidden {
            action: "edit this team".to_string(),
        });
    }

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
) -> ApiJson<Team> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_manage_team(event.visibility, event.phase, event.is_read_only) {
        return Err(ApiError::Forbidden {
            action: "delete this team".to_string(),
        });
    }

    state.team_service.delete_team(team_id).await?;

    Ok(Json(team))
}

#[utoipa::path(
    get,
    path = "/api/teams/{team_id}/roles",
    responses(
        (status = StatusCode::OK, body = HashSet<TeamRole>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_team_roles(ctx: Ctx, Path(team_id): Path<Uuid>) -> ApiJson<TeamRoles> {
    let roles = ctx.roles().get_team_roles(&team_id);
    Ok(Json(roles))
}

#[utoipa::path(
    put,
    path = "/api/teams/{team_id}/roles",
    responses(
        (status = StatusCode::OK, body = AffectedRows),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn put_team_roles(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<HashMap<Uuid, HashSet<TeamRole>>>,
) -> ApiJson<AffectedRows> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    let mut contains_member_roles = false;
    let mut contains_mentor_roles = false;

    for roles in body.values() {
        if roles.contains(&TeamRole::Member) {
            contains_member_roles = true;
        }

        if roles.contains(&TeamRole::Mentor) {
            contains_mentor_roles = true;
        }
    }

    if contains_member_roles
        && !groups.can_manage_team(event.visibility, event.phase, event.is_read_only)
    {
        return Err(ApiError::Forbidden {
            action: "create member role assignments for this team".to_string(),
        });
    }

    if contains_mentor_roles && !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "create mentor role assignments for this team".to_string(),
        });
    }

    let affected_rows = state
        .authorization_service
        .assign_team_roles(team_id, body)
        .await?;

    let affected_rows = AffectedRows { affected_rows };

    Ok(Json(affected_rows))
}

#[utoipa::path(
    delete,
    path = "/api/teams/{team_id}/roles",
    responses(
        (status = StatusCode::OK, body = AffectedRows),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn delete_team_roles(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<HashMap<Uuid, HashSet<TeamRole>>>,
) -> ApiJson<AffectedRows> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    let mut contains_member_roles = false;
    let mut contains_mentor_roles = false;

    for roles in body.values() {
        if roles.contains(&TeamRole::Member) {
            contains_member_roles = true;
        }

        if roles.contains(&TeamRole::Mentor) {
            contains_mentor_roles = true;
        }
    }

    if contains_member_roles
        && !groups.can_manage_team(event.visibility, event.phase, event.is_read_only)
    {
        return Err(ApiError::Forbidden {
            action: "delete member role assignments for this team".to_string(),
        });
    }

    if contains_mentor_roles && !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "delete mentor role assignments for this team".to_string(),
        });
    }

    let affected_rows = state
        .authorization_service
        .unassign_team_roles(team_id, body)
        .await?;

    let affected_rows = AffectedRows { affected_rows };

    Ok(Json(affected_rows))
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
) -> ApiJsonVec<TeamAffiliate> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_view_event_internal(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view team affiliates".to_string(),
        });
    }

    let affiliates = state
        .authorization_service
        .get_team_affiliates(team_id, query.role)
        .await?;

    Ok(Json(affiliates))
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
    Json(body): Json<ProjectIdDTO>,
) -> ApiJson<Team> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "update the project for this team".to_string(),
        });
    }

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
) -> ApiJson<ProjectPreferences> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_view_team_confidential(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view project preferences for this team".to_string(),
        });
    }

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
) -> ApiJson<ProjectPreferences> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_manage_team(event.visibility, event.phase, event.is_read_only) {
        return Err(ApiError::Forbidden {
            action: "update project preferences for this team".to_string(),
        });
    }

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
        (status = StatusCode::OK, body = PasswordDTO),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_team_password(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJson<PasswordDTO> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_view_team_confidential(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view the password for this team".to_string(),
        });
    }

    let password = state.team_service.get_team_password(team_id).await?;
    let password = PasswordDTO { password };

    Ok(Json(password))
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
    Json(body): Json<PasswordDTO>,
) -> ApiJson<Team> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "update the password for this team".to_string(),
        });
    }

    let team = state
        .team_service
        .update_team_password(team_id, body.password)
        .await?;

    Ok(Json(team))
}
