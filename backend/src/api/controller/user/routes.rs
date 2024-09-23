use crate::api::schema::user::CreateUser;
use crate::appState::AppState;
use crate::error::BackendResult;
use axum::extract::{Path, Query, State};
use axum::Json;
use sea_orm::prelude::Uuid;
use sea_orm::{DeleteResult, TransactionTrait};
use utoipauto::utoipauto;
use crate::api::service::user as ServiceUser;
use crate::entity::user as DbUser;

#[utoipa::path(
    get,
    path = "/api/user",
    responses(
        (status = StatusCode::OK, body = Vec<DbUser::Model>),
    )
)]
pub async fn get_all_users(state: State<AppState>) -> BackendResult<Json<Vec<DbUser::Model>>> {
    let trx: sea_orm::DatabaseTransaction = state.db.begin().await?;
    let result: Vec<DbUser::Model> = ServiceUser::get_all_users(&trx).await?;
    let _  = trx.commit().await?;
    Ok(Json(result))
}


#[utoipa::path(
    get,
    path = "/api/user/{user_id}",
    responses(
        (status = StatusCode::OK, body = DbUser::Model),
    )
)]
pub async fn get_user_by_id(state: State<AppState>, Path(id) : Path<Uuid>) -> BackendResult<Json<DbUser::Model>> {
    let trx: sea_orm::DatabaseTransaction = state.db.begin().await?;
    let result = ServiceUser::get_user_by_id(&trx, id).await?;
    let _ = trx.commit().await?;
    Ok(Json(result))
}

#[utoipa::path(
    delete,
    path = "/api/user/{user_id}/delete",
    responses(
        (status = StatusCode::OK, body = ()),
    )
)]
pub async fn delete_user_by_id(state: State<AppState>, Path(id) : Path<Uuid>) -> BackendResult<()> {
    let trx: sea_orm::DatabaseTransaction = state.db.begin().await?;
    let result = ServiceUser::delete_user(&trx, id).await?;
    let _ = trx.commit().await?;
    Ok(())
}

#[utoipa::path(
    post,
    path = "/api/user",
    params(),
    responses(
        (status = StatusCode::OK, body = DbUser::Model),
    )
)]
pub async fn post_user(State(state): State<AppState>, Json(user): Json<CreateUser>) -> BackendResult<Json<DbUser::Model>> {
    let trx: sea_orm::DatabaseTransaction = state.db.begin().await?;
    let result = ServiceUser::add_user(&trx, user).await?;
    let _ = trx.commit().await?;
    Ok(Json(result))
}
