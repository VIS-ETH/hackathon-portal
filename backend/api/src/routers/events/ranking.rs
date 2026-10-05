use crate::api_state::ApiState;
use crate::ctx::Ctx;
use crate::error::{ApiJson, ApiJsonVec};
use crate::routers::events::models::{RankingQuery, SetCurrentRankingSnapshot};
use crate::ApiError;
use axum::extract::{Path, Query, State};
use axum::Json;
use hackathon_portal_services::authorization::groups::Groups;
use hackathon_portal_services::ranking::models::{Ranking, RankingSnapshot, RankingSnapshotInfo};
use uuid::Uuid;

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/ranking",
    responses(
        (status = StatusCode::OK, body = Option<RankingSnapshot>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    ),
    params(
        ("snapshot_id" = Option<Uuid>, Query, description = "Snapshot to return; defaults to the current one"),
    )
)]
pub async fn get_ranking(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Query(query): Query<RankingQuery>,
) -> ApiJson<Option<RankingSnapshot>> {
    let groups = Groups::from_event(ctx.roles(), event_id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "view ranking for this event".to_string(),
        });
    }

    let snapshot = state
        .ranking_service
        .get_snapshot(event_id, query.snapshot_id)
        .await?;

    Ok(Json(snapshot))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/ranking/live",
    responses(
        (status = StatusCode::OK, body = Ranking),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_live_ranking(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
) -> ApiJson<Ranking> {
    let groups = Groups::from_event(ctx.roles(), event_id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "view live ranking for this event".to_string(),
        });
    }

    let ranking = state.ranking_service.live(event_id).await?;

    Ok(Json(ranking))
}

#[utoipa::path(
    get,
    path = "/api/events/{event_id}/ranking/snapshots",
    responses(
        (status = StatusCode::OK, body = Vec<RankingSnapshotInfo>),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn get_ranking_snapshots(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
) -> ApiJsonVec<RankingSnapshotInfo> {
    let groups = Groups::from_event(ctx.roles(), event_id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "view ranking snapshots for this event".to_string(),
        });
    }

    let snapshots = state.ranking_service.list_snapshots(event_id).await?;

    Ok(Json(snapshots))
}

#[utoipa::path(
    post,
    path = "/api/events/{event_id}/ranking/snapshots",
    responses(
        (status = StatusCode::OK, body = RankingSnapshot),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn create_ranking_snapshot(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
) -> ApiJson<RankingSnapshot> {
    let groups = Groups::from_event(ctx.roles(), event_id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "create ranking snapshots for this event".to_string(),
        });
    }

    let snapshot = state.ranking_service.create_snapshot(event_id).await?;

    Ok(Json(snapshot))
}

#[utoipa::path(
    put,
    path = "/api/events/{event_id}/ranking/current",
    responses(
        (status = StatusCode::OK, body = RankingSnapshotInfo),
        (status = StatusCode::INTERNAL_SERVER_ERROR, body = PublicError),
    )
)]
pub async fn set_current_ranking_snapshot(
    ctx: Ctx,
    State(state): State<ApiState>,
    Path(event_id): Path<Uuid>,
    Json(body): Json<SetCurrentRankingSnapshot>,
) -> ApiJson<RankingSnapshotInfo> {
    let groups = Groups::from_event(ctx.roles(), event_id);

    if !groups.can_manage_event() {
        return Err(ApiError::Forbidden {
            action: "set the current ranking snapshot for this event".to_string(),
        });
    }

    let snapshot = state
        .ranking_service
        .set_current_snapshot(event_id, body.snapshot_id)
        .await?;

    Ok(Json(snapshot))
}
