use crate::db::generated::{project_preference, team};
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::{JoinType, QueryOrder, QuerySelect};

pub struct ProjectPreferenceRepository;

impl ProjectPreferenceRepository {
    pub async fn fetch_all_by_team_id<C: ConnectionTrait>(
        db: &C,
        team_id: Uuid,
    ) -> RepositoryResult<Vec<project_preference::Model>> {
        project_preference::Entity::find()
            .filter(project_preference::Column::TeamId.eq(team_id))
            .order_by_asc(project_preference::Column::Score)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }

    pub async fn fetch_all_by_event_id<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
    ) -> RepositoryResult<Vec<project_preference::Model>> {
        project_preference::Entity::find()
            .join(
                JoinType::InnerJoin,
                project_preference::Relation::Team.def(),
            )
            .filter(team::Column::EventId.eq(event_id))
            .order_by_asc(project_preference::Column::TeamId)
            .order_by_asc(project_preference::Column::Score)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }
}
