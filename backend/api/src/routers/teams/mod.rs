pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::{ApiJson, ApiJsonVec, PublicError};
use crate::models::AffectedRows;
use crate::routers::events::models::EventIdQuery;
use crate::routers::teams::models::{
    AdminTeam, CreateTeamAPIKey, Team, TeamRankingView, TeamViewPermissions,
};
use crate::routers::users::models::TeamRoleOptQuery;
use crate::ApiError;
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, patch, post, put};
use axum::{Json, Router};
use hackathon_portal_repositories::db::TeamRole;
use hackathon_portal_services::authorization::groups::Groups;
use hackathon_portal_services::authorization::models::{TeamAffiliate, TeamRoles, TeamRolesMap};
use hackathon_portal_services::secret::models::SecretValue;
use hackathon_portal_services::team::models::{
    TeamBlog, TeamBlogForUpdate, TeamForCreate, TeamForUpdate,
};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", post(create_team))
        .route("/", get(get_teams))
        .route("/admin", get(get_admin_teams))
        .route("/roles", get(get_teams_roles))
        .route("/affiliates", get(get_teams_affiliates))
        .route("/project-preferences", get(get_teams_project_preferences))
        .route("/slug/{event_slug}/{team_slug}", get(get_team_by_slug))
        .route("/{team_id}", get(get_team))
        .route("/{team_id}", patch(update_team))
        .route("/{team_id}", delete(delete_team))
        .route("/{team_id}/admin", get(get_admin_team))
        .route("/{team_id}/roles", get(get_team_roles))
        .route("/{team_id}/roles", put(put_team_roles))
        .route("/{team_id}/roles", delete(delete_team_roles))
        .route("/{team_id}/affiliates", get(get_team_affiliates))
        .route(
            "/{team_id}/project-preferences",
            get(get_team_project_preferences),
        )
        .route(
            "/{team_id}/project-preferences",
            patch(update_team_project_preferences),
        )
        .route("/{team_id}/blog", get(get_team_blog))
        .route("/{team_id}/blog", put(update_team_blog))
        .route("/{team_id}/secrets", get(get_team_secrets))
        .route("/{team_id}/ranking", get(get_team_ranking))
        .route("/{team_id}/ai-api-keys", post(create_team_ai_api_key))
        .with_state(state.clone())
}

/// Create a team
#[utoipa::path(
    post,
    path = "/api/teams",
    responses(
        (status = StatusCode::OK, body = Team),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["create_team"]))),
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

    Ok(Json(Team::from((team, TeamViewPermissions::default()))))
}

/// Get all teams of an event
///
/// `project_id` requires `view_project_assignment`, `finalist` requires `view_finalists` and
/// `repository_url` requires `view_team_blog`.
#[utoipa::path(
    get,
    path = "/api/teams",
    responses(
        (status = StatusCode::OK, body = Vec<Team>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(EventIdQuery),
    extensions(("x-policies" = json!(["view_event"]))),
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

    let permissions = TeamViewPermissions::new(&groups, &event);

    let teams = state
        .team_service
        .get_teams(event.id)
        .await?
        .into_iter()
        .map(|team| {
            // the user's roles on a team may additionally reveal its repository
            let permissions =
                if permissions.repository || ctx.roles().get_team_roles(&team.id).is_empty() {
                    permissions
                } else {
                    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);
                    TeamViewPermissions::new(&groups, &event)
                };

            Team::from((team, permissions))
        })
        .collect();

    Ok(Json(teams))
}

/// Get all teams of an event with their internal fields
#[utoipa::path(
    get,
    path = "/api/teams/admin",
    responses(
        (status = StatusCode::OK, body = Vec<AdminTeam>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(EventIdQuery),
    extensions(("x-policies" = json!(["manage_event"]))),
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

/// Get my roles on all teams of an event
#[utoipa::path(
    get,
    path = "/api/teams/roles",
    responses(
        (status = StatusCode::OK, body = HashMap<Uuid, HashSet<TeamRole>>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(EventIdQuery),
    extensions(("x-policies" = json!(["view_event"]))),
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

/// Get the users on all teams of an event
#[utoipa::path(
    get,
    path = "/api/teams/affiliates",
    responses(
        (status = StatusCode::OK, body = HashMap<Uuid, Vec<TeamAffiliate>>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(EventIdQuery),
    extensions(("x-policies" = json!(["manage_event"]))),
)]
pub async fn get_teams_affiliates(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
) -> ApiJson<HashMap<Uuid, Vec<TeamAffiliate>>> {
    let event = state.event_service.get_event(query.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "view team affiliates for this event".to_string(),
        });
    }

    let affiliates = state
        .authorization_service
        .get_teams_affiliates(event.id)
        .await?;

    Ok(Json(affiliates))
}

/// Get the project preferences of all teams of an event
#[utoipa::path(
    get,
    path = "/api/teams/project-preferences",
    responses(
        (status = StatusCode::OK, body = HashMap<Uuid, Vec<Uuid>>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(EventIdQuery),
    extensions(("x-policies" = json!(["manage_event"]))),
)]
pub async fn get_teams_project_preferences(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
) -> ApiJson<HashMap<Uuid, Vec<Uuid>>> {
    let event = state.event_service.get_event(query.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "view project preferences for this event".to_string(),
        });
    }

    let pps = state
        .team_service
        .get_teams_project_preferences(event.id)
        .await?;

    Ok(Json(pps))
}

/// Get a team by slug
///
/// `project_id` requires `view_project_assignment`, `finalist` requires `view_finalists` and
/// `repository_url` requires `view_team_blog`.
#[utoipa::path(
    get,
    path = "/api/teams/slug/{event_slug}/{team_slug}",
    responses(
        (status = StatusCode::OK, body = Team),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["view_event"]))),
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

    let team = state
        .team_service
        .get_team_by_slug(&event_slug, &team_slug)
        .await?;

    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);
    let permissions = TeamViewPermissions::new(&groups, &event);

    Ok(Json(Team::from((team, permissions))))
}

/// Get a team by id
///
/// `project_id` requires `view_project_assignment`, `finalist` requires `view_finalists` and
/// `repository_url` requires `view_team_blog`.
#[utoipa::path(
    get,
    path = "/api/teams/{team_id}",
    responses(
        (status = StatusCode::OK, body = Team),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["view_event"]))),
)]
pub async fn get_team(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJson<Team> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_view_event(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view this team".to_string(),
        });
    }

    let permissions = TeamViewPermissions::new(&groups, &event);

    Ok(Json(Team::from((team, permissions))))
}

/// Get a team with its internal fields
#[utoipa::path(
    get,
    path = "/api/teams/{team_id}/admin",
    responses(
        (status = StatusCode::OK, body = AdminTeam),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["manage_event"]))),
)]
pub async fn get_admin_team(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJson<AdminTeam> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "view internal details of this team for this event".to_string(),
        });
    }

    Ok(Json(AdminTeam::from(team)))
}

/// Update a team
///
/// Requires `view_event`. Changing the name, photo, repository or ingress config requires `update_team_name`, `update_team_photo`, `update_team_blog` or `update_team_ingress_config`. All other fields require `manage_event`.
#[utoipa::path(
    patch,
    path = "/api/teams/{team_id}",
    responses(
        (status = StatusCode::OK, body = Team),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["view_event", "update_team_name", "update_team_photo", "update_team_blog", "update_team_ingress_config", "manage_event"]))),
)]
pub async fn update_team(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<TeamForUpdate>,
) -> ApiJson<Team> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_view_event(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "update this team".to_string(),
        });
    }

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

    if body.repository_url.is_some()
        && !groups.can_update_team_blog(event.visibility, event.phase, event.read_only)
    {
        return Err(ApiError::Forbidden {
            action: "edit the code repository of this team".to_string(),
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
        || body.comment.is_some()
        || body.extra_score.is_some()
        || body.managed_address_override.is_some()
        || body.direct_address_override.is_some()
        || body.private_address_override.is_some()
        || body.ssh_config_override.is_some()
        || body.ingress_enabled.is_some()
        || body.finalist.is_some())
        && !groups.can_manage_event()
    {
        return Err(ApiError::Forbidden {
            action: "edit internal details of this team".to_string(),
        });
    }

    let team = state
        .team_service
        .update_team(team_id, ctx.user().id, body)
        .await?;

    let permissions = TeamViewPermissions::new(&groups, &event);

    Ok(Json(Team::from((team, permissions))))
}

/// Delete a team
#[utoipa::path(
    delete,
    path = "/api/teams/{team_id}",
    responses(
        (status = StatusCode::OK, body = Team),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["manage_team"]))),
)]
pub async fn delete_team(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJson<Team> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_manage_team(event.visibility, event.phase, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "delete this team".to_string(),
        });
    }

    state.team_service.delete_team(team_id).await?;

    let permissions = TeamViewPermissions::new(&groups, &event);

    Ok(Json(Team::from((team, permissions))))
}

/// Get my roles on a team
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

/// Add team role assignments
///
/// Member roles require `manage_team`, mentor and stakeholder roles require `manage_event`.
#[utoipa::path(
    put,
    path = "/api/teams/{team_id}/roles",
    responses(
        (status = StatusCode::OK, body = AffectedRows),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["manage_team", "manage_event"]))),
)]
pub async fn put_team_roles(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<HashMap<Uuid, HashSet<TeamRole>>>,
) -> ApiJson<AffectedRows> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    let mut contains_member_roles = false;
    let mut contains_mentor_roles = false;
    let mut contains_stakeholder_roles = false;

    for roles in body.values() {
        if roles.contains(&TeamRole::Member) {
            contains_member_roles = true;
        }

        if roles.contains(&TeamRole::Mentor) {
            contains_mentor_roles = true;
        }

        if roles.contains(&TeamRole::Stakeholder) {
            contains_stakeholder_roles = true;
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

    if contains_stakeholder_roles && !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "create stakeholder role assignments for this team".to_string(),
        });
    }

    let affected_rows = state
        .authorization_service
        .assign_team_roles(team_id, body)
        .await?;

    let affected_rows = AffectedRows { affected_rows };

    Ok(Json(affected_rows))
}

/// Remove team role assignments
///
/// Member roles require `manage_team`, mentor and stakeholder roles require `manage_event`.
#[utoipa::path(
    delete,
    path = "/api/teams/{team_id}/roles",
    responses(
        (status = StatusCode::OK, body = AffectedRows),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["manage_team", "manage_event"]))),
)]
pub async fn delete_team_roles(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<HashMap<Uuid, HashSet<TeamRole>>>,
) -> ApiJson<AffectedRows> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    let mut contains_member_roles = false;
    let mut contains_mentor_roles = false;
    let mut contains_stakeholder_roles = false;

    for roles in body.values() {
        if roles.contains(&TeamRole::Member) {
            contains_member_roles = true;
        }

        if roles.contains(&TeamRole::Mentor) {
            contains_mentor_roles = true;
        }

        if roles.contains(&TeamRole::Stakeholder) {
            contains_stakeholder_roles = true;
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

    if contains_stakeholder_roles && !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "delete stakeholder role assignments for this team".to_string(),
        });
    }

    let affected_rows = state
        .authorization_service
        .unassign_team_roles(team_id, body)
        .await?;

    let affected_rows = AffectedRows { affected_rows };

    Ok(Json(affected_rows))
}

/// Get the users on a team
#[utoipa::path(
    get,
    path = "/api/teams/{team_id}/affiliates",
    responses(
        (status = StatusCode::OK, body = Vec<TeamAffiliate>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(TeamRoleOptQuery),
    extensions(("x-policies" = json!(["view_event_internal"]))),
)]
pub async fn get_team_affiliates(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Query(query): Query<TeamRoleOptQuery>,
) -> ApiJsonVec<TeamAffiliate> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
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

/// Get the project preferences of a team
#[utoipa::path(
    get,
    path = "/api/teams/{team_id}/project-preferences",
    responses(
        (status = StatusCode::OK, body = Vec<Uuid>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["view_team_confidential"]))),
)]
pub async fn get_team_project_preferences(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJsonVec<Uuid> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
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

/// Set the project preferences of a team
///
/// Expects exactly 3 distinct project ids.
#[utoipa::path(
    patch,
    path = "/api/teams/{team_id}/project-preferences",
    responses(
        (status = StatusCode::OK, body = Vec<Uuid>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["manage_team"]))),
)]
pub async fn update_team_project_preferences(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<Vec<Uuid>>,
) -> ApiJsonVec<Uuid> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
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

/// Get the blog sections of a team
#[utoipa::path(
    get,
    path = "/api/teams/{team_id}/blog",
    responses(
        (status = StatusCode::OK, body = TeamBlog),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["view_team_blog"]))),
)]
pub async fn get_team_blog(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJson<TeamBlog> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_view_team_blog(event.visibility, event.phase) {
        return Err(ApiError::Forbidden {
            action: "view the blog of this team".to_string(),
        });
    }

    let blog = state.team_service.get_team_blog(team_id).await?;

    Ok(Json(blog))
}

/// Replace the blog sections of a team
#[utoipa::path(
    put,
    path = "/api/teams/{team_id}/blog",
    responses(
        (status = StatusCode::OK, body = TeamBlog),
        (status = StatusCode::CONFLICT, body = PublicError),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["update_team_blog"]))),
)]
pub async fn update_team_blog(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<TeamBlogForUpdate>,
) -> ApiJson<TeamBlog> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_update_team_blog(event.visibility, event.phase, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "edit the blog of this team".to_string(),
        });
    }

    let blog = state
        .team_service
        .update_team_blog(team_id, ctx.user().id, body)
        .await?;

    Ok(Json(blog))
}

/// Get the values of the secrets of a team
#[utoipa::path(
    get,
    path = "/api/teams/{team_id}/secrets",
    responses(
        (status = StatusCode::OK, body = Vec<SecretValue>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["view_team_confidential"]))),
)]
pub async fn get_team_secrets(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJsonVec<SecretValue> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_view_team_confidential(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view the secrets of this team".to_string(),
        });
    }

    let secrets = state.secret_service.get_team_secrets(team.id).await?;

    Ok(Json(secrets))
}

/// Create an AI API key for a team
///
/// Creates a `LiteLLM` key with the given budget.
#[utoipa::path(
    post,
    path = "/api/teams/{team_id}/ai-api-keys",
    responses(
        (status = StatusCode::OK, body = ()),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["manage_event"]))),
)]
pub async fn create_team_ai_api_key(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
    Json(body): Json<CreateTeamAPIKey>,
) -> ApiJson<String> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
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

/// Get the entry of a team in the current ranking snapshot
#[utoipa::path(
    get,
    path = "/api/teams/{team_id}/ranking",
    responses(
        (status = StatusCode::OK, body = Option<TeamRankingView>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    extensions(("x-policies" = json!(["view_team_feedback"]))),
)]
pub async fn get_team_ranking(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(team_id): Path<Uuid>,
) -> ApiJson<Option<TeamRankingView>> {
    let (team, event) = state.team_service.get_team_with_event(team_id).await?;
    let groups = Groups::from_event_and_team(ctx.roles(), event.id, team.id);

    if !groups.can_view_team_feedback(event.visibility, event.phase, event.feedback_visible) {
        return Err(ApiError::Forbidden {
            action: "view feedback for this team".to_string(),
        });
    }

    let snapshot = state.ranking_service.get_snapshot(event.id, None).await?;
    let view = snapshot.and_then(|snapshot| {
        let max_total_points = snapshot.ranking.max_total_points;
        snapshot
            .ranking
            .teams
            .into_iter()
            .find(|entry| entry.team_id == team_id)
            .map(|entry| TeamRankingView {
                max_total_points,
                team: entry,
            })
    });

    Ok(Json(view))
}
