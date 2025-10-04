use crate::authorization::models::{AffiliateRow, TeamAffiliate, TeamRolesMap};
use crate::authorization::AuthorizationService;
use crate::user::fmt_user_name;
use crate::{ServiceError, ServiceResult};
use hackathon_portal_repositories::db::{
    db_team, db_team_role_assignment, db_user, EventRepository, TeamRepository, TeamRole,
    TeamRoleAssignmentRepository, TryInsertResultExt,
};
use sea_orm::prelude::*;
use sea_orm::sea_query::OnConflict;
use sea_orm::{Condition, JoinType, QuerySelect, QueryTrait, SelectColumns, Set, TransactionTrait};
use std::collections::HashMap;
use uuid::Uuid;

impl AuthorizationService {
    pub async fn get_team_roles(&self, user_id: Uuid) -> ServiceResult<TeamRolesMap> {
        let roles =
            TeamRoleAssignmentRepository::fetch_all_by_user_id(self.db_repo.conn(), user_id)
                .await?;

        let roles_map =
            roles
                .into_iter()
                .fold(HashMap::new(), |mut acc: TeamRolesMap, assignment| {
                    acc.entry(assignment.team_id)
                        .or_default()
                        .insert(assignment.role);

                    acc
                });

        Ok(roles_map)
    }

    /// Inserts team role assignments.
    /// Ensures that each user is member of at most one team per event.
    pub async fn assign_team_roles(
        &self,
        team_id: Uuid,
        roles: TeamRolesMap,
    ) -> ServiceResult<u64> {
        let team = TeamRepository::fetch_by_id(self.db_repo.conn(), team_id).await?;
        let event = EventRepository::fetch_by_id(self.db_repo.conn(), team.event_id).await?;

        let mut active_role_assignments = Vec::new();

        for (user_id, roles) in roles {
            for role in roles {
                active_role_assignments.push(db_team_role_assignment::ActiveModel {
                    user_id: Set(user_id),
                    team_id: Set(team_id),
                    role: Set(role),
                });
            }
        }

        let txn = self.db_repo.conn().begin().await?;

        let rows_affected = db_team_role_assignment::Entity::insert_many(active_role_assignments)
            .on_conflict(
                OnConflict::columns(vec![
                    db_team_role_assignment::Column::UserId,
                    db_team_role_assignment::Column::TeamId,
                    db_team_role_assignment::Column::Role,
                ])
                .do_nothing()
                .to_owned(),
            )
            .on_empty_do_nothing()
            .exec_without_returning(&txn)
            .await?
            .unwrap_or_default();

        // Ensure that each user is member of at most one team per event
        let conflicting_user = db_user::Entity::find()
            .join(
                JoinType::InnerJoin,
                db_user::Relation::TeamRoleAssignment.def(),
            )
            .join(
                JoinType::InnerJoin,
                db_team_role_assignment::Relation::Team.def(),
            )
            .filter(db_team_role_assignment::Column::Role.eq(TeamRole::Member))
            .filter(db_team::Column::EventId.eq(team.event_id))
            .group_by(db_user::Column::Id)
            .having(Expr::cust("COUNT(*) > 1"))
            .one(&txn)
            .await?;

        if let Some(conflicting_user) = conflicting_user {
            txn.rollback().await?;
            return Err(ServiceError::UserIsAlreadyMemberOfAnotherTeam {
                name: conflicting_user.name,
            });
        }

        // Ensure that max_team_size is not exceeded
        let team_size = db_team_role_assignment::Entity::find()
            .filter(db_team_role_assignment::Column::TeamId.eq(team_id))
            .filter(db_team_role_assignment::Column::Role.eq(TeamRole::Member))
            .count(&txn)
            .await?;

        if team_size > event.max_team_size as u64 {
            return Err(ServiceError::TeamSizeExceeded {
                expected: event.max_team_size as usize,
                actual: team_size as usize,
            });
        }

        txn.commit().await?;

        Ok(rows_affected)
    }

    pub async fn unassign_team_roles(
        &self,
        team_id: Uuid,
        roles: TeamRolesMap,
    ) -> ServiceResult<u64> {
        let mut rows_affected = 0;
        let txn = self.db_repo.conn().begin().await?;

        for (user_id, roles) in roles {
            for role in roles {
                let result = db_team_role_assignment::Entity::delete_many()
                    .filter(
                        Condition::all()
                            .add(db_team_role_assignment::Column::UserId.eq(user_id))
                            .add(db_team_role_assignment::Column::TeamId.eq(team_id))
                            .add(db_team_role_assignment::Column::Role.eq(role)),
                    )
                    .exec(&txn)
                    .await?;

                rows_affected += result.rows_affected;
            }
        }

        let remaining_members = db_team_role_assignment::Entity::find()
            .filter(db_team_role_assignment::Column::TeamId.eq(team_id))
            .filter(db_team_role_assignment::Column::Role.eq(TeamRole::Member))
            .count(&txn)
            .await?;

        if remaining_members == 0 {
            txn.rollback().await?;

            return Err(ServiceError::CannotUnassignAllAdmins {
                resource: "team".to_string(),
                id: team_id.to_string(),
            });
        }

        txn.commit().await?;

        Ok(rows_affected)
    }

    pub async fn get_team_affiliates(
        &self,
        team_id: Uuid,
        role: Option<TeamRole>,
    ) -> ServiceResult<Vec<TeamAffiliate>> {
        let affiliate_rows = db_user::Entity::find()
            .inner_join(db_team_role_assignment::Entity)
            .filter(db_team_role_assignment::Column::TeamId.eq(team_id))
            .apply_if(role, |q, v| {
                q.filter(db_team_role_assignment::Column::Role.eq(v))
            })
            .select_only()
            .select_column(db_user::Column::Id)
            .select_column(db_user::Column::Name)
            .select_column(db_user::Column::Index)
            .select_column(db_team_role_assignment::Column::Role)
            .into_model::<AffiliateRow<TeamRole>>()
            .all(self.db_repo.conn())
            .await?;

        let mut affiliates = affiliate_rows
            .into_iter()
            .fold(
                HashMap::new(),
                |mut acc: HashMap<Uuid, TeamAffiliate>, row| {
                    let affiliate = acc.entry(row.id).or_insert(TeamAffiliate {
                        id: row.id,
                        name: fmt_user_name(&row.name, row.index),
                        roles: Vec::new(),
                    });

                    affiliate.roles.push(row.role);

                    acc
                },
            )
            .values()
            .cloned()
            .collect::<Vec<_>>();

        affiliates.sort_by(|a, b| a.name.cmp(&b.name));

        Ok(affiliates)
    }

    pub async fn count_team_affiliates(
        &self,
        team_id: Uuid,
        role: Option<TeamRole>,
    ) -> ServiceResult<u64> {
        let count = db_user::Entity::find()
            .distinct()
            .inner_join(db_team_role_assignment::Entity)
            .filter(db_team_role_assignment::Column::TeamId.eq(team_id))
            .apply_if(role, |q, v| {
                q.filter(db_team_role_assignment::Column::Role.eq(v))
            })
            .count(self.db_repo.conn())
            .await?;

        Ok(count)
    }
}
