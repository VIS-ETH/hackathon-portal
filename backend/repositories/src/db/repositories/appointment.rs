use crate::db::generated::appointment;
use crate::db::OrFailExt;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::QueryOrder;

pub struct AppointmentRepository;

impl AppointmentRepository {
    pub async fn fetch_all_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<appointment::Model>> {
        appointment::Entity::find()
            .filter(appointment::Column::EventId.eq(event_id))
            .order_by_asc(appointment::Column::Start)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_by_id<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<appointment::Model> {
        appointment::Entity::find_by_id(id)
            .one(db)
            .await?
            .or_fail(appointment::Entity, id)
    }
}
