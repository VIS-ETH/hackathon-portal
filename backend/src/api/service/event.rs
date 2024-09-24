use crate::api::schema::event::CreateEvent;
use crate::appState::AppState;
use crate::entity::event as DbEvent;
use crate::error::{BackendError, BackendResult};
use sea_orm::prelude::Uuid;
use sea_orm::QueryFilter;
use sea_orm::{ActiveModelTrait, ConnectionTrait, DeleteResult, EntityTrait, ModelTrait, Set};
use sea_orm::{EntityOrSelect, IntoActiveModel};

pub async fn get_all_events(trx: &impl ConnectionTrait) -> BackendResult<Vec<DbEvent::Model>> {
    let events = DbEvent::Entity::find().all(trx).await?;
    Ok(events)
}

pub async fn get_event_by_id(
    trx: &impl ConnectionTrait,
    id: Uuid,
) -> BackendResult<DbEvent::Model> {
    let event = DbEvent::Entity::find_by_id(id).one(trx).await?;
    match event {
        None => Err(BackendError::IdNotFound {
            entity: "event".to_string(),
            id: id.to_string(),
        }),
        Some(event) => Ok(event),
    }
}

pub async fn add_event(
    trx: &impl ConnectionTrait,
    event: CreateEvent,
) -> BackendResult<DbEvent::Model> {
    let active_event = DbEvent::ActiveModel {
        name: Set(event.name),
        start: Set(event.start),
        end: Set(event.end),
        max_team_size: Set(event.max_team_size),
        kdf_secret: Set(event.kdf_secret),
        is_feedback_visible : Set(event.is_feedback_visible),
        is_hidden : Set(event.is_hidden),
        phase : Set(event.phase),
        ..Default::default()
    };

    let result = active_event.insert(trx).await?;
    Ok(result)
}

pub async fn update_event(
    trx: &impl ConnectionTrait,
    event: DbEvent::Model,
) -> BackendResult<DbEvent::Model> {
    let active = event.into_active_model();
    let result = active.update(trx).await?;
    Ok(result)
}

pub async fn delete_event(trx: &impl ConnectionTrait, id: Uuid) -> BackendResult<DeleteResult> {
    let event = get_event_by_id(trx, id).await?;
    let result = event.delete(trx).await?;
    Ok(result)
}
