pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::routers::events::models::EventIdQuery;
use crate::ApiResult;
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use services::appointment::model::{Appointment, AppointmentForCreate, AppointmentForUpdate};
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", get(get_appointments))
        .route("/", post(create_appointment))
        .route("/:appointment_id", get(get_appointment))
        .route("/:appointment_id", patch(update_appointment))
        .route("/:appointment_id", delete(delete_appointment))
        .with_state(state.clone())
}

#[utoipa::path(
    get,
    path = "/api/appointments",
    responses(
        (status = StatusCode::OK, body = Vec<Appointment>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("event_id"= Uuid, Query, description = "Filter by event id"),
    )
)]
pub async fn get_appointments(
    ctx: Ctx,
    State(state): State<ApiState>,
    Query(query): Query<EventIdQuery>,
) -> ApiResult<Json<Vec<Appointment>>> {
    let event = state.event_service.get_event(query.event_id).await?;

    state
        .authorization_service
        .view_event_guard(ctx.roles(), event.id, event.visibility)?;

    let appointments = state.appointment_service.get_appointments(event.id).await?;

    Ok(Json(appointments))
}

#[utoipa::path(
    post,
    path = "/api/appointments",
    responses(
        (status = StatusCode::OK, body = Appointment),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn create_appointment(
    ctx: Ctx,
    State(state): State<ApiState>,
    Json(body): Json<AppointmentForCreate>,
) -> ApiResult<Json<Appointment>> {
    state
        .authorization_service
        .edit_event_guard(ctx.roles(), body.event_id)?;

    let appointment = state.appointment_service.create_appointment(body).await?;

    Ok(Json(appointment))
}

#[utoipa::path(
    get,
    path = "/api/appointments/{appointment_id}",
    responses(
        (status = StatusCode::OK, body = Appointment),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn get_appointment(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(appointment_id): Path<Uuid>,
) -> ApiResult<Json<Appointment>> {
    let appointment = state
        .appointment_service
        .get_appointment(appointment_id)
        .await?;

    let event = state.event_service.get_event(appointment.event_id).await?;

    state
        .authorization_service
        .view_event_guard(ctx.roles(), event.id, event.visibility)?;

    Ok(Json(appointment))
}

#[utoipa::path(
    patch,
    path = "/api/appointments/{appointment_id}",
    responses(
        (status = StatusCode::OK, body = Appointment),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn update_appointment(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(appointment_id): Path<Uuid>,
    Json(body): Json<AppointmentForUpdate>,
) -> ApiResult<Json<Appointment>> {
    let appointment = state
        .appointment_service
        .get_appointment(appointment_id)
        .await?;

    state
        .authorization_service
        .edit_event_guard(ctx.roles(), appointment.event_id)?;

    let appointment = state
        .appointment_service
        .update_appointment(appointment_id, body)
        .await?;

    Ok(Json(appointment))
}

#[utoipa::path(
    delete,
    path = "/api/appointments/{appointment_id}",
    responses(
        (status = StatusCode::OK, body = Appointment),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn delete_appointment(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(appointment_id): Path<Uuid>,
) -> ApiResult<Json<Appointment>> {
    let appointment = state
        .appointment_service
        .get_appointment(appointment_id)
        .await?;

    state
        .authorization_service
        .edit_event_guard(ctx.roles(), appointment.event_id)?;

    state
        .appointment_service
        .delete_appointment(appointment_id)
        .await?;

    Ok(Json(appointment))
}
