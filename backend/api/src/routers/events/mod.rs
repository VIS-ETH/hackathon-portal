pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::{ApiJson, ApiJsonVec};
use crate::models::AffectedRows;
use crate::routers::events::models::{
    DiscordOauthBody, EventDiscordResponse, InviteUsersDTO, SidequestsHistoryQuery,
};
use crate::routers::sidequests::models::SidequestIdQuery;
use crate::routers::users::models::EventRoleOptQuery;
use crate::{ApiError, ApiResult};
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, patch, post, put};
use axum::{Json, Router};
use hackathon_portal_repositories::db::prelude::EventRole;
use hackathon_portal_services::authorization::groups::Groups;
use hackathon_portal_services::authorization::models::{EventAffiliate, EventRoles, EventRolesMap};
use hackathon_portal_services::event::models::{Event, EventForUpdate};
use hackathon_portal_services::rating::models::ExpertRatingLeaderboardEntry;
use hackathon_portal_services::sidequest::models::{
    HistoryEntry, TeamLeaderboardEntry, UserLeaderboardEntry,
};
use hackathon_portal_services::team::models::Team;
use hackathon_portal_services::user::models::ReducedUser;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(get_events))
        .route("/roles", get(get_events_roles))
        .route("/slug/:event_slug", get(get_event_by_slug))
        .route("/:event_id", get(get_event))
        .route("/:event_id", patch(update_event))
        .route("/:event_id/discord", get(get_event_discord_oauth))
        .route("/:event_id/discord", post(post_event_discord_oauth))
        .route("/:event_id/roles", get(get_event_roles))
        .route("/:event_id/roles", put(put_event_roles))
        .route("/:event_id/roles", delete(delete_event_roles))
        .route("/:event_id/invite", post(invite_users))
        .route("/:event_id/affiliates", get(get_event_affiliates))
        .route("/:event_id/teams/index", post(index_teams))
        .route("/:event_id/projects/matching", get(get_projects_matching))
        .route("/:event_id/leaderboard", get(get_leaderboard))
        .route(
            "/:event_id/expert-ratings/leaderboard",
            get(get_expert_ratings_leaderboard),
        )
        .route(
            "/:event_id/sidequests/leaderboard",
            get(get_sidequests_leaderboard),
        )
        .route(
            "/:event_id/sidequests/team-leaderboard",
            get(get_sidequests_team_leaderboard),
        )
        .route(
            "/:event_id/sidequests/user-leaderboard",
            get(get_sidequests_user_leaderboard),
        )
        .route("/:event_id/sidequests/history", get(get_sidequests_history))
        .with_state(state.clone())
}

#[utoipa::path(
    get,
    path = "/api/events",
    responses(
        (status = StatusCode::OK, body = Vec<Event>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_events(ctx: Ctx, State(state): State<ApiState>) -> ApiJsonVec<Event> {
    let events = state.event_service.get_events().await?;

    let events = events
        .into_iter()
        .filter(|event| Groups::from_event(ctx.roles(), event.id).can_view_event(event.visibility))
        .collect::<Vec<_>>();

    Ok(Json(events))
}

#[utoipa::path(
    get,
    path = "/api/events/roles",
    responses(
        (status = StatusCode::OK, body = HashMap<Uuid, HashSet<EventRole>>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_events_roles(ctx: Ctx) -> ApiJson<EventRolesMap> {
    let roles = ctx.roles().event.clone();
    Ok(Json(roles))
}

#[utoipa::path(
    get,
    path = "/api/events/slug/{event_slug}",
    responses(
        (status = StatusCode::OK, body = Event),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_event_by_slug(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_slug): Path<String>,
) -> ApiJson<Event> {
    let event = state.event_service.get_event_by_slug(&event_slug).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view this event".to_string(),
        });
    }

    Ok(Json(event))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}",
    responses(
        (status = StatusCode::OK, body = Event),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_event(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
) -> ApiJson<Event> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view this event".to_string(),
        });
    }

    Ok(Json(event))
}

#[utoipa::path(
    patch,
    path = "/api/events/{event_id}",
    responses(
        (status = StatusCode::OK, body = Event),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn update_event(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Json(body): Json<EventForUpdate>,
) -> ApiJson<Event> {
    let groups = Groups::from_event(ctx.roles(), event_id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "update this event".to_string(),
        });
    }

    let event = state.event_service.update_event(event_id, body).await?;

    Ok(Json(event))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/roles",
    responses(
        (status = StatusCode::OK, body = HashSet<EventRole>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_event_roles(ctx: Ctx, Path(event_id): Path<Uuid>) -> ApiJson<EventRoles> {
    let roles = ctx.roles().get_event_roles(&event_id);

    Ok(Json(roles))
}

#[utoipa::path(
    put,
    path = "/api/events/{event_id}/roles",
    responses(
        (status = StatusCode::OK, body = AffectedRows),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn put_event_roles(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Json(body): Json<HashMap<Uuid, HashSet<EventRole>>>,
) -> ApiJson<AffectedRows> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "create role assignments for this event".to_string(),
        });
    }

    let affected_rows = state
        .authorization_service
        .assign_event_roles(event_id, body)
        .await?;

    let affected_rows = AffectedRows { affected_rows };

    Ok(Json(affected_rows))
}

#[utoipa::path(
    delete,
    path = "/api/events/{event_id}/roles",
    responses(
        (status = StatusCode::OK, body = AffectedRows),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn delete_event_roles(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Json(body): Json<HashMap<Uuid, HashSet<EventRole>>>,
) -> ApiJson<AffectedRows> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "delete role assignments for this event".to_string(),
        });
    }

    let affected_rows = state
        .authorization_service
        .unassign_event_roles(event_id, body)
        .await?;

    let affected_rows = AffectedRows { affected_rows };

    Ok(Json(affected_rows))
}

#[utoipa::path(
    post,
    path = "/api/events/{event_id}/invite",
    responses(
        (status = StatusCode::OK, body = Vec<ReducedUser>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn invite_users(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Json(body): Json<InviteUsersDTO>,
) -> ApiJsonVec<ReducedUser> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "invite users to this event".to_string(),
        });
    }

    let new_users = state
        .event_service
        .invite_users(event_id, body.users, body.roles)
        .await?;

    Ok(Json(new_users))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/affiliates",
    responses(
        (status = StatusCode::OK, body = Vec<EventAffiliate>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("role" = Option<EventRole>, Query, description = "Filter by event role"),
    )
)]
pub async fn get_event_affiliates(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Query(query): Query<EventRoleOptQuery>,
) -> ApiJson<Vec<EventAffiliate>> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event_internal(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view event affiliates".to_string(),
        });
    }

    let affiliates = state
        .authorization_service
        .get_event_affiliates(event_id, query.role)
        .await?;

    Ok(Json(affiliates))
}

#[utoipa::path(
    post,
    path = "/api/events/{event_id}/teams/index",
    responses(
        (status = StatusCode::OK, body = Vec<Team>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn index_teams(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
) -> ApiJsonVec<Team> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "reindex teams for this event".to_string(),
        });
    }

    let res = state.team_service.index_teams(event_id).await?;

    Ok(Json(res))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/projects/matching",
    responses(
        (status = StatusCode::OK, body = HashMap<Uuid, Uuid>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_projects_matching(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
) -> ApiJson<HashMap<Uuid, Uuid>> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "get the projects matching for this event".to_string(),
        });
    }

    let matching = state.project_service.get_matching(event_id).await?;

    Ok(Json(matching))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/leaderboard",
    responses(
        (status = StatusCode::OK, body = Vec<Uuid>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_leaderboard(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
) -> ApiJsonVec<Uuid> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event_feedback(event.visibility, event.phase, event.feedback_visible) {
        return Err(ApiError::Forbidden {
            action: "view leaderboard for this event".to_string(),
        });
    }

    let leaderboard = state.event_service.get_leaderboard(event_id).await?;

    Ok(Json(leaderboard))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/expert-ratings/leaderboard",
    responses(
        (status = StatusCode::OK, body = Vec<ExpertRatingLeaderboardEntry>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_expert_ratings_leaderboard(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
) -> ApiJsonVec<ExpertRatingLeaderboardEntry> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "view expert ratings leaderboard for this event".to_string(),
        });
    }

    let leaderboard = state
        .rating_service
        .get_expert_leaderboard(event_id)
        .await?;

    Ok(Json(leaderboard))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/sidequests/leaderboard",
    responses(
        (status = StatusCode::OK, body = Vec<TeamLeaderboardEntry>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_sidequests_leaderboard(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
) -> ApiJson<Vec<TeamLeaderboardEntry>> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event_internal(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view sidequest leaderboard for this event".to_string(),
        });
    }

    let leaderboard = state.sidequest_service.get_leaderboard(event_id).await?;

    Ok(Json(leaderboard))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/sidequests/team-leaderboard",
    responses(
        (status = StatusCode::OK, body = Vec<TeamLeaderboardEntry>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("sidequest_id" = Uuid, Query, description = "Filter by sidequest id"),
    )
)]
pub async fn get_sidequests_team_leaderboard(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Query(query): Query<SidequestIdQuery>,
) -> ApiJson<Vec<TeamLeaderboardEntry>> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event_internal(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view sidequest leaderboard for this event".to_string(),
        });
    }

    let leaderboard = state
        .sidequest_service
        .get_sidequest_leaderboard_by_team(query.sidequest_id)
        .await?;

    Ok(Json(leaderboard))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/sidequests/user-leaderboard",
    responses(
        (status = StatusCode::OK, body = Vec<UserLeaderboardEntry>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("sidequest_id" = Uuid, Query, description = "Filter by sidequest id"),
    )
)]
pub async fn get_sidequests_user_leaderboard(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Query(query): Query<SidequestIdQuery>,
) -> ApiJson<Vec<UserLeaderboardEntry>> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event_internal(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view sidequest leaderboard for this event".to_string(),
        });
    }

    let leaderboard = state
        .sidequest_service
        .get_sidequest_leaderboard_by_user(query.sidequest_id)
        .await?;

    Ok(Json(leaderboard))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/sidequests/history",
    responses(
        (status = StatusCode::OK, body = HashMap<Uuid, Vec<HistoryEntry>>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("after" = Option<NaiveDateTime>, Query, description = "Filter by after date"),
        ("before" = Option<NaiveDateTime>, Query, description = "Filter by before date"),
    )
)]
pub async fn get_sidequests_history(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Query(query): Query<SidequestsHistoryQuery>,
) -> ApiJson<HashMap<Uuid, Vec<HistoryEntry>>> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event_internal(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view sidequest history for this event".to_string(),
        });
    }

    let history = state
        .sidequest_service
        .get_history(event_id, query.after, query.before)
        .await?;

    Ok(Json(history))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/discord",
    responses(
        (status = StatusCode::OK, body = EventDiscordResponse),
        (status = StatusCode::BAD_REQUEST, body = PublicError),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_event_discord_oauth(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
) -> ApiJson<EventDiscordResponse> {
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view this event".to_string(),
        });
    }

    // Extract the user ID from the context
    let user_id = ctx.user().id;

    let discord_id = state
        .user_service
        .get_event_discord_id(user_id, event.id)
        .await?;

    let response = EventDiscordResponse {
        discord_user_id: discord_id,
    };

    Ok(Json(response))
}

#[utoipa::path(
    post,
    path = "/api/events/{event_id}/discord",
    responses(
        (status = StatusCode::OK, body = ()),
        (status = StatusCode::BAD_REQUEST, body = PublicError),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn post_event_discord_oauth(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Json(body): Json<DiscordOauthBody>,
) -> ApiResult<()> {
    #[derive(Deserialize)]
    struct TokenResponse {
        access_token: String,
    }

    #[derive(Deserialize)]
    struct UserInfoResponse {
        id: String,
    }

    #[derive(Serialize)]
    struct PutMemberRequest<'a> {
        access_token: &'a str,
        nick: &'a str,
    }

    // Verify event and permissions
    let event = state.event_service.get_event(event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    // TODO: temporary restriction until the Discord config is event-specific
    if !groups.can_view_event(event.visibility) || !event.slug.contains("viscon-2025") {
        return Err(ApiError::Forbidden {
            action: "join this event on Discord".to_string(),
        });
    }

    // TODO: move out of the handler at some point

    let client = Client::new();
    let params = [
        ("client_id", state.discord_config.client_id.as_str()),
        ("client_secret", state.discord_config.client_secret.as_str()),
        ("grant_type", "authorization_code"),
        ("code", body.code.as_str()),
        ("redirect_uri", body.redirect_uri.as_str()),
    ];

    let token = client
        .post("https://discord.com/api/oauth2/token")
        .form(&params)
        .send()
        .await?
        .json::<TokenResponse>()
        .await?;

    // Get user info from Discord
    let user_info = client
        .get("https://discord.com/api/users/@me")
        .bearer_auth(&token.access_token)
        .send()
        .await?
        .json::<UserInfoResponse>()
        .await?;

    // Add user to guild
    client
        .put(format!(
            "https://discord.com/api/guilds/{}/members/{}",
            state.discord_config.guild_id, // FIXME hardcoded guild id,
            user_info.id
        ))
        .header(
            "Authorization",
            format!("Bot {}", state.discord_config.bot_token),
        )
        .json(&PutMemberRequest {
            access_token: &token.access_token,
            nick: &ctx.user().name,
        })
        .send()
        .await?
        .error_for_status()?;

    state
        .user_service
        .update_discord_id(ctx.user().id, event.id, user_info.id)
        .await?;

    Ok(())
}
