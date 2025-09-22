pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::{ApiJson, ApiJsonVec};
use crate::routers::events::models::EventIdQuery;
use crate::ApiError;
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use hackathon_portal_services::authorization::groups::Groups;
use hackathon_portal_services::project::models::{Project, ProjectForCreate, ProjectForUpdate};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", post(create_project))
        .route("/", get(get_projects))
        .route("/slug/:event_slug/:project_slug", get(get_project_by_slug))
        .route("/:project_id", get(get_project))
        .route("/:project_id", patch(update_project))
        .route("/:project_id", delete(delete_project))
        .with_state(state.clone())
}

#[utoipa::path(
    post,
    path = "/api/projects",
    responses(
        (status = StatusCode::OK, body = Project),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn create_project(
    ctx: Ctx,
    State(state): State<ApiState>,
    Json(body): Json<ProjectForCreate>,
) -> ApiJson<Project> {
    let event = state.event_service.get_event(body.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_project(event.visibility, event.phase, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "create a project for this event".to_string(),
        });
    }

    let project = state.project_service.create_project(body).await?;

    Ok(Json(project))
}

#[utoipa::path(
    get,
    path = "/api/projects",
    responses(
        (status = StatusCode::OK, body = Vec<Project>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id"= Uuid, Query, description = "Filter by event id"),
    )
)]
pub async fn get_projects(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
) -> ApiJsonVec<Project> {
    let event = state.event_service.get_event(query.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_project(event.visibility, event.projects_visible) {
        return Err(ApiError::Forbidden {
            action: "view projects for this event".to_string(),
        });
    }

    let projects = state.project_service.get_projects(event.id).await?;

    Ok(Json(projects))
}

#[utoipa::path(
    get,
    path = "/api/projects/slug/{event_slug}/{project_slug}",
    responses(
        (status = StatusCode::OK, body = Project),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_project_by_slug(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path((event_slug, project_slug)): Path<(String, String)>,
) -> ApiJson<Project> {
    let project = state
        .project_service
        .get_project_by_slug(&event_slug, &project_slug)
        .await?;

    let event = state.event_service.get_event(project.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_project(event.visibility, event.projects_visible) {
        return Err(ApiError::Forbidden {
            action: "view this project".to_string(),
        });
    }

    Ok(Json(project))
}

#[utoipa::path(
    get,
    path = "/api/projects/{project_id}",
    responses(
        (status = StatusCode::OK, body = Project),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_project(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(project_id): Path<Uuid>,
) -> ApiJson<Project> {
    let project = state.project_service.get_project(project_id).await?;
    let event = state.event_service.get_event(project.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_project(event.visibility, event.projects_visible) {
        return Err(ApiError::Forbidden {
            action: "view this project".to_string(),
        });
    }

    Ok(Json(project))
}

#[utoipa::path(
    patch,
    path = "/api/projects/{project_id}",
    responses(
        (status = StatusCode::OK, body = Appointment),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn update_project(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(project_id): Path<Uuid>,
    Json(body): Json<ProjectForUpdate>,
) -> ApiJson<Project> {
    let project = state.project_service.get_project(project_id).await?;
    let event = state.event_service.get_event(project.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_project(event.visibility, event.phase, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "edit this project".to_string(),
        });
    }

    let project = state
        .project_service
        .update_project(project_id, body)
        .await?;

    Ok(Json(project))
}

#[utoipa::path(
    delete,
    path = "/api/projects/{project_id}",
    responses(
        (status = StatusCode::OK, body = Project),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn delete_project(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(project_id): Path<Uuid>,
) -> ApiJson<Project> {
    let project = state.project_service.get_project(project_id).await?;
    let event = state.event_service.get_event(project.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_project(event.visibility, event.phase, event.read_only) {
        return Err(ApiError::Forbidden {
            action: "delete this project".to_string(),
        });
    }

    state.project_service.delete_project(project_id).await?;

    Ok(Json(project))
}
