use crate::db::generated::event_user_discord_id;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::Condition;

pub struct EventUserRepository;

impl EventUserRepository {
    pub async fn fetch_by_id_opt<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
        user_id: Uuid,
    ) -> RepositoryResult<Option<event_user_discord_id::Model>> {
        event_user_discord_id::Entity::find()
            .filter(
                Condition::all()
                    .add(event_user_discord_id::Column::EventId.eq(event_id))
                    .add(event_user_discord_id::Column::UserId.eq(user_id)),
            )
            .one(db)
            .await
            .map_err(RepositoryError::from)
    }
}
