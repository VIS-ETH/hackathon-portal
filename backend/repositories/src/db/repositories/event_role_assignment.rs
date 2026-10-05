use crate::db::generated::event_role_assignment;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;

pub struct EventRoleAssignmentRepository;

impl EventRoleAssignmentRepository {
    pub async fn fetch_all_by_user_id<C: ConnectionTrait>(
        db: &C,
        user_id: Uuid,
    ) -> RepositoryResult<Vec<event_role_assignment::Model>> {
        event_role_assignment::Entity::find()
            .filter(event_role_assignment::Column::UserId.eq(user_id))
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_all_by_event_id_and_user_ids<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
        user_ids: &[Uuid],
    ) -> RepositoryResult<Vec<event_role_assignment::Model>> {
        event_role_assignment::Entity::find()
            .filter(event_role_assignment::Column::EventId.eq(event_id))
            .filter(event_role_assignment::Column::UserId.is_in(user_ids.iter().copied()))
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }
}
