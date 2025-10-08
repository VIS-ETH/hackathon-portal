pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::{ApiJson, ApiJsonVec};
use crate::models::AffectedRows;
use crate::routers::events::models::EventIdQuery;
use crate::routers::teams::models::{AdminTeam, CreateTeamAPIKey, Team, TeamCredentials};
use crate::routers::users::models::TeamRoleOptQuery;
use crate::ApiError;
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, patch, post, put};
use axum::{Json, Router};
use hackathon_portal_repositories::db::{ExpertRatingCategory, TeamRole};
use hackathon_portal_services::authorization::groups::Groups;
use hackathon_portal_services::authorization::models::{TeamAffiliate, TeamRoles, TeamRolesMap};
use hackathon_portal_services::team::models::{TeamForCreate, TeamForUpdate};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", post(create_team))
        .route("/", get(get_teams))
        .route("/admin", get(get_admin_teams))
        .route("/roles", get(get_teams_roles))
        .route("/slug/:event_slug/:team_slug", get(get_team_by_slug))
        .route("/:team_id", get(get_team))
        .route("/:team_id", patch(update_team))
        .route("/:team_id", delete(delete_team))
        .route("/:team_id/admin", get(get_admin_team))
        .route("/:team_id/roles", get(get_team_roles))
        .route("/:team_id/roles", put(put_team_roles))
        .route("/:team_id/roles", delete(delete_team_roles))
        .route("/:team_id/affiliates", get(get_team_affiliates))
        .route(
            "/:team_id/project-preferences",
            get(get_team_project_preferences),
        )
        .route(
            "/:team_id/project-preferences",
            patch(update_team_project_preferences),
        )
        .route("/:team_id/credentials", get(get_team_credentials))
        .route("/:team_id/expert-ratings", get(get_team_expert_ratings))
        .route("/:team_id/ai-api-keys", post(create_team_ai_api_key))
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

    if !groups.can_create_team(event.visibility, event.phase, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "create a team for this event".to_string(),
        });
    }

    let team = state.team_service.create_team(ctx.user().id, body).await?;

    Ok(Json(Team::from((team, false))))
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

    let can_view_project_assignment = groups.can_view_project_assignment(
        event.visibility,
        event.projects_visible,
        event.project_assignments_visible,
    );

    let teams = state
        .team_service
        .get_teams(event.id)
        .await?
        .into_iter()
        .map(|team| Team::from((team, can_view_project_assignment)))
        .collect();

    Ok(Json(teams))
}

#[utoipa::path(
    get,
    path = "/api/teams/admin",
    responses(
        (status = StatusCode::OK, body = Vec<AdminTeam>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id"= Uuid, Query, description = "Filter by event id"),
    )
)]
pub async fn get_admin_teams(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
) -> ApiJsonVec<AdminTeam> {
    let event = state.event_service.get_event(query.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "view internal details of teams for this event".to_string(),
        });
    }

    let teams = state
        .team_service
        .get_teams(event.id)
        .await?
        .into_iter()
        .map(AdminTeam::from)
        .collect();

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
    let event = state.event_service.get_event_by_slug(&event_slug).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view this team".to_string(),
        });
    }

    let can_view_project_assignment = groups.can_view_project_assignment(
        event.visibility,
        event.projects_visible,
        event.project_assignments_visible,
    );

    let team = state
        .team_service
        .get_team_by_slug(&event_slug, &team_slug)
        .await?;

    Ok(Json(Team::from((team, can_view_project_assignment))))
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

    let can_view_project_assignment = groups.can_view_project_assignment(
        event.visibility,
        event.projects_visible,
        event.project_assignments_visible,
    );

    let team = state.team_service.get_team(team_id).await?;

    Ok(Json(Team::from((team, can_view_project_assignment))))
}

#[utoipa::path(
    get,
    path = "/api/teams/{team_id}/admin",
    responses(
        (status = StatusCode::OK, body = AdminTeam),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_admin_team(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJson<AdminTeam> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "view internal details of this team for this event".to_string(),
        });
    }

    Ok(Json(AdminTeam::from(team)))
}

#[utoipa::path(
    patch,
    path = "/api/teams/{team_id}",
    responses(
        (status = StatusCode::OK, body = Team),
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

    if body.name.is_some()
        && !groups.can_update_team_name(event.visibility, event.phase, event.read_only)
    {
        return Err(ApiError::Forbidden {
            action: "edit the name of this team".to_string(),
        });
    }

    if body.photo_id.is_some()
        && !groups.can_update_team_photo(event.visibility, event.phase, event.read_only)
    {
        return Err(ApiError::Forbidden {
            action: "edit the photo of this team".to_string(),
        });
    }

    if body.ingress_config.is_some()
        && !groups.can_update_team_ingress_config(event.visibility, event.phase, event.read_only)
    {
        return Err(ApiError::Forbidden {
            action: "edit the ingress config of this team".to_string(),
        });
    }

    if (body.project_id.is_some()
        || body.password.is_some()
        || body.ai_api_key.is_some()
        || body.comment.is_some()
        || body.extra_score.is_some()
        || body.managed_address_override.is_some()
        || body.direct_address_override.is_some()
        || body.private_address_override.is_some()
        || body.ssh_config_override.is_some()
        || body.ingress_enabled.is_some())
        && !groups.can_manage_event()
    {
        return Err(ApiError::Forbidden {
            action: "edit internal details of this team".to_string(),
        });
    }

    let team = state.team_service.update_team(team_id, body).await?;

    let can_view_project_assignment = groups.can_view_project_assignment(
        event.visibility,
        event.projects_visible,
        event.project_assignments_visible,
    );

    Ok(Json(Team::from((team, can_view_project_assignment))))
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

    if !groups.can_manage_team(event.visibility, event.phase, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "delete this team".to_string(),
        });
    }

    state.team_service.delete_team(team_id).await?;

    let can_view_project_assignment = groups.can_view_project_assignment(
        event.visibility,
        event.projects_visible,
        event.project_assignments_visible,
    );

    Ok(Json(Team::from((team, can_view_project_assignment))))
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
        && !groups.can_manage_team(event.visibility, event.phase, event.read_only)
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
        && !groups.can_manage_team(event.visibility, event.phase, event.read_only)
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
    get,
    path = "/api/teams/{team_id}/project-preferences",
    responses(
        (status = StatusCode::OK, body = Vec<Uuid>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_team_project_preferences(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJsonVec<Uuid> {
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
        (status = StatusCode::OK, body = Vec<Uuid>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn update_team_project_preferences(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<Vec<Uuid>>,
) -> ApiJsonVec<Uuid> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_manage_team(event.visibility, event.phase, event.read_only) {
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
    path = "/api/teams/{team_id}/credentials",
    responses(
        (status = StatusCode::OK, body = TeamCredentials),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_team_credentials(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJson<TeamCredentials> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_view_team_confidential(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view the credentials for this team".to_string(),
        });
    }

    Ok(Json(TeamCredentials::from(team)))
}

#[utoipa::path(
    get,
    path = "/api/teams/{team_id}/expert-ratings",
    responses(
        (status = StatusCode::OK, body = HashMap<ExpertRatingCategory, f64>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_team_expert_ratings(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJson<HashMap<ExpertRatingCategory, f64>> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_view_team_feedback(event.visibility, event.phase, event.feedback_visible) {
        return Err(ApiError::Forbidden {
            action: "view expert ratings for this team".to_string(),
        });
    }

    let ratings = state
        .rating_service
        .aggregate_expert_ratings(team_id)
        .await?;

    Ok(Json(ratings))
}

#[utoipa::path(
    post,
    path = "/api/teams/{team_id}/ai-api-keys",
    responses(
        (status = StatusCode::OK, body = ()),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn create_team_ai_api_key(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<CreateTeamAPIKey>,
) -> ApiJson<String> {
    let team = state.team_service.get_team(team_id).await?;
    let event = state.event_service.get_event(team.event_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "create an AI API key for this team".to_string(),
        });
    }

    let key = state
        .team_service
        .create_team_ai_api_key(team_id, body.budget, event.id)
        .await?;

    Ok(Json(key))
}
