pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::routers::events::models::EventIdQuery;
use crate::ApiResult;
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use services::project::model::{Project, ProjectForCreate, ProjectForUpdate};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(get_projects))
        .route("/", post(create_project))
        .route("/:event_slug/:project_slug", get(get_project_by_slug))
        .route("/:project_id", get(get_project))
        .route("/:project_id", patch(update_project))
        .route("/:project_id", delete(delete_project))
        .with_state(state.clone())
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
) -> ApiResult<Json<Vec<Project>>> {
    let event = state.event_service.get_event(query.event_id).await?;

    state
        .authorization_service
        .view_event_guard(ctx.roles(), event.id, event.visibility)?;

    let projects = state.project_service.get_projects(event.id).await?;

    Ok(Json(projects))
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
) -> ApiResult<Json<Project>> {
    state
        .authorization_service
        .write_project_guard(ctx.roles(), body.event_id)?;

    let project = state.project_service.create_project(body).await?;

    Ok(Json(project))
}

#[utoipa::path(
    get,
    path = "/api/projects/{event_slug}/{project_slug}",
    responses(
        (status = StatusCode::OK, body = Project),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_project_by_slug(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path((event_slug, project_slug)): Path<(String, String)>,
) -> ApiResult<Json<Project>> {
    let project = state
        .project_service
        .get_project_by_slug(&event_slug, &project_slug)
        .await?;

    let event = state.event_service.get_event(project.event_id).await?;

    state
        .authorization_service
        .view_event_guard(ctx.roles(), event.id, event.visibility)?;

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
) -> ApiResult<Json<Project>> {
    let project = state.project_service.get_project(project_id).await?;

    let event = state.event_service.get_event(project.event_id).await?;

    state
        .authorization_service
        .view_event_guard(ctx.roles(), event.id, event.visibility)?;

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
) -> ApiResult<Json<Project>> {
    let project = state.project_service.get_project(project_id).await?;

    state
        .authorization_service
        .write_project_guard(ctx.roles(), project.event_id)?;

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
) -> ApiResult<Json<Project>> {
    let project = state.project_service.get_project(project_id).await?;

    state
        .authorization_service
        .write_project_guard(ctx.roles(), project.event_id)?;

    state.project_service.delete_project(project_id).await?;

    Ok(Json(project))
}
