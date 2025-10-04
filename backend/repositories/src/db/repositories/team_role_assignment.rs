use crate::db::generated::team_role_assignment;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;

pub struct TeamRoleAssignmentRepository;

impl TeamRoleAssignmentRepository {
    pub async fn fetch_all_by_user_id<C: ConnectionTrait>(
        db: &C,
        user_id: Uuid,
    ) -> RepositoryResult<Vec<team_role_assignment::Model>> {
        team_role_assignment::Entity::find()
            .filter(team_role_assignment::Column::UserId.eq(user_id))
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }
}
