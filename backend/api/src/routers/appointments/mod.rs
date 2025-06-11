pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::{ApiJson, ApiJsonVec};
use crate::routers::events::models::EventIdQuery;
use crate::ApiError;
use axum::extract::{Path, Query, State};
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use hackathon_portal_services::appointment::models::{
    Appointment, AppointmentForCreate, AppointmentForUpdate,
};
use hackathon_portal_services::authorization::groups::Groups;
use uuid::Uuid;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", post(create_appointment))
        .route("/", get(get_appointments))
        .route("/:appointment_id", get(get_appointment))
        .route("/:appointment_id", patch(update_appointment))
        .route("/:appointment_id", delete(delete_appointment))
        .with_state(state.clone())
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
) -> ApiJson<Appointment> {
    let groups = Groups::from_event(ctx.roles(), body.event_id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "create an appointment for this event".to_string(),
        });
    }

    let appointment = state.appointment_service.create_appointment(body).await?;

    Ok(Json(appointment))
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
) -> ApiJsonVec<Appointment> {
    let event = state.event_service.get_event(query.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event_internal(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view appointments for this event".to_string(),
        });
    }

    let appointments = state.appointment_service.get_appointments(event.id).await?;

    Ok(Json(appointments))
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
) -> ApiJson<Appointment> {
    let appointment = state
        .appointment_service
        .get_appointment(appointment_id)
        .await?;

    let event = state.event_service.get_event(appointment.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_view_event_internal(event.visibility) {
        return Err(ApiError::Forbidden {
            action: "view this appointment".to_string(),
        });
    }

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
) -> ApiJson<Appointment> {
    let appointment = state
        .appointment_service
        .get_appointment(appointment_id)
        .await?;

    let event = state.event_service.get_event(appointment.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "update this appointment".to_string(),
        });
    }

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
) -> ApiJson<Appointment> {
    let appointment = state
        .appointment_service
        .get_appointment(appointment_id)
        .await?;

    let event = state.event_service.get_event(appointment.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "delete this appointment".to_string(),
        });
    }

    state
        .appointment_service
        .delete_appointment(appointment_id)
        .await?;

    Ok(Json(appointment))
}
