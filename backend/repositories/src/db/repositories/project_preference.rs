use crate::db::generated::project_preference;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::QueryOrder;

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
}
