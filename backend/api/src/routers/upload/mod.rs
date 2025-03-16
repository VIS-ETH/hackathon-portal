pub mod models;

use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::ApiJson;
use crate::routers::upload::models::CreateUploadDTO;
use crate::ApiError;
use axum::extract::State;
use axum::routing::post;
use axum::{Json, Router};
use hackathon_portal_services::authorization::groups::Groups;
use hackathon_portal_services::upload::models::UploadUrl;
use mime::Mime;
use std::str::FromStr;
use std::string::ToString;

pub fn get_router(state: &ApiState) -> Router {
    Router::new()
        .route("/", post(create_upload))
        .with_state(state.clone())
}

#[utoipa::path(
    post,
    path = "/api/uploads",
    responses(
        (status = StatusCode::OK, body = Upload),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
)]
pub async fn create_upload(
    ctx: Ctx,
    State(state): State<ApiState>,
    Json(body): Json<CreateUploadDTO>,
) -> ApiJson<UploadUrl> {
    let event = state.event_service.get_event(body.event_id).await?;
    let groups = Groups::from_event(ctx.roles(), event.id);

    if !groups.can_create_upload(event.visibility, event.phase, event.is_read_only) {
        return Err(ApiError::Forbidden {
            action: "create an upload for this event".to_string(),
        });
    }

    let mime = Mime::from_str(&body.content_type).map_err(|_| ApiError::BadRequest {
        reason: "Invalid mime type".to_string(),
    })?;

    dbg!(&mime, mime.type_(), mime.subtype());

    state
        .upload_service
        .validate_upload_request(ctx.user().id, body.usage, &mime, body.content_length)
        .await?;

    let upload = state
        .upload_service
        .create_upload(ctx.user().id, body.usage, &mime, body.content_length)
        .await?;

    Ok(Json(upload))
}
