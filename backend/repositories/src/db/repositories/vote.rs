use crate::db::generated::{team, vote};
use crate::{RepositoryError, RepositoryResult};
use sea_orm::QuerySelect;
use sea_orm::{prelude::*, JoinType};

pub struct VoteRepository;

impl VoteRepository {
    pub async fn fetch_votes_by_user_in_event<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
        user_id: Uuid,
    ) -> RepositoryResult<Vec<vote::Model>> {
        vote::Entity::find()
            .join(JoinType::InnerJoin, vote::Relation::Team.def())
            .filter(vote::Column::UserId.eq(user_id))
            .join(JoinType::InnerJoin, team::Relation::Event.def())
            .filter(team::Column::EventId.eq(event_id))
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_votes_for_team<C: ConnectionTrait>(
        db: &C,
        team_id: Uuid,
    ) -> RepositoryResult<Vec<vote::Model>> {
        let votes = vote::Entity::find()
            .filter(vote::Column::TeamId.eq(team_id))
            .all(db)
            .await
            .map_err(RepositoryError::from)?;

        Ok(votes)
    }
}
