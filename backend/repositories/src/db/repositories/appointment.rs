use crate::db::generated::{appointment, event};
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
            .or_fail(appointment::Entity.table_name(), id)
    }

    #[expect(
        clippy::missing_panics_doc,
        reason = "the foreign key constraint guarantees the event exists"
    )]
    pub async fn fetch_by_id_with_event<C: ConnectionTrait>(
        db: &C,
        id: Uuid,
    ) -> RepositoryResult<(appointment::Model, event::Model)> {
        let (appointment, event) = appointment::Entity::find_by_id(id)
            .find_also_related(event::Entity)
            .one(db)
            .await?
            .or_fail(appointment::Entity.table_name(), id)?;

        let event = event.expect("Foreign key constraint ensures event exists");

        Ok((appointment, event))
    }
}
