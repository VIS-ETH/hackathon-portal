use crate::db::generated::sea_orm_active_enums::TeamRole;
use crate::db::generated::{team, team_role_assignment};
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::{Condition, JoinType, QuerySelect};

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

    pub async fn fetch_all_by_event_id_and_role<C: ConnectionTrait>(
        db: &C,
        event_id: Uuid,
        role: TeamRole,
    ) -> RepositoryResult<Vec<team_role_assignment::Model>> {
        team_role_assignment::Entity::find()
            .join(
                JoinType::InnerJoin,
                team_role_assignment::Relation::Team.def(),
            )
            .filter(
                Condition::all()
                    .add(team::Column::EventId.eq(event_id))
                    .add(team_role_assignment::Column::Role.eq(role)),
            )
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }
}
