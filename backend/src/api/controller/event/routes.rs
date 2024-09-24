use crate::api::schema::event::CreateEvent;
use crate::api::service::event as ServiceEvent;
use crate::appState::AppState;
use crate::entity::event as DbEvent;
use crate::error::BackendResult;
use axum::extract::{Path, Query, State};
use axum::Json;
use sea_orm::prelude::Uuid;
use sea_orm::{DeleteResult, TransactionTrait};
use utoipauto::utoipauto;

#[utoipa::path(
    get,
    path = "/api/event",
    responses(
        (status = StatusCode::OK, body = Vec<DbEvent::Model>),
    )
)]
pub async fn get_all_events(state: State<AppState>) -> BackendResult<Json<Vec<DbEvent::Model>>> {
    let trx: sea_orm::DatabaseTransaction = state.db.begin().await?;
    let result: Vec<DbEvent::Model> = ServiceEvent::get_all_events(&trx).await?;
    let _ = trx.commit().await?;
    Ok(Json(result))
}

#[utoipa::path(
    get,
    path = "/api/event/{event_id}",
    responses(
        (status = StatusCode::OK, body = DbEvent::Model),
    )
)]
pub async fn get_event_by_id(
    state: State<AppState>,
    Path(id): Path<Uuid>,
) -> BackendResult<Json<DbEvent::Model>> {
    let trx: sea_orm::DatabaseTransaction = state.db.begin().await?;
    let result = ServiceEvent::get_event_by_id(&trx, id).await?;
    let _ = trx.commit().await?;
    Ok(Json(result))
}

#[utoipa::path(
    delete,
    path = "/api/event/{event_id}/delete",
    responses(
        (status = StatusCode::OK, body = ()),
    )
)]
pub async fn delete_event_by_id(state: State<AppState>, Path(id): Path<Uuid>) -> BackendResult<()> {
    let trx: sea_orm::DatabaseTransaction = state.db.begin().await?;
    let result = ServiceEvent::delete_event(&trx, id).await?;
    let _ = trx.commit().await?;
    Ok(())
}

#[utoipa::path(
    post,
    path = "/api/event",
    params(),
    responses(
        (status = StatusCode::OK, body = DbEvent::Model),
    )
)]
pub async fn post_event(
    State(state): State<AppState>,
    Json(event): Json<CreateEvent>,
) -> BackendResult<Json<DbEvent::Model>> {
    let trx: sea_orm::DatabaseTransaction = state.db.begin().await?;
    let result = ServiceEvent::add_event(&trx, event).await?;
    let _ = trx.commit().await?;
    Ok(Json(result))
}


#[utoipa::path(
    put,
    path = "/api/event",
    params(),
    responses(
        (status = StatusCode::OK, body = DbEvent::Model),
    )
)]
pub async fn put_event(
    State(state): State<AppState>,
    Json(event): Json<DbEvent::Model>,
) -> BackendResult<Json<DbEvent::Model>> {
    let trx: sea_orm::DatabaseTransaction = state.db.begin().await?;
    let result = ServiceEvent::update_event(&trx, event).await?;
    let _ = trx.commit().await?;
    Ok(Json(result))
}
