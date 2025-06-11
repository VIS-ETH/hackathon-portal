use crate::authorization::models::{AffiliateRow, EventAffiliate, EventRolesMap};
use crate::authorization::AuthorizationService;
use crate::user::fmt_user_name;
use crate::utils::try_insert_result_to_int;
use crate::{ServiceError, ServiceResult};
use hackathon_portal_repositories::db::prelude::{db_event_role_assignment, db_user, EventRole};
use sea_orm::prelude::*;
use sea_orm::sea_query::OnConflict;
use sea_orm::{Condition, QuerySelect, QueryTrait, SelectColumns, Set, TransactionTrait};
use std::collections::HashMap;
use uuid::Uuid;

impl AuthorizationService {
    pub async fn get_event_roles(&self, user_id: Uuid) -> ServiceResult<EventRolesMap> {
        let roles = self.db_repo.get_event_roles(None, Some(user_id)).await?;

        let roles_map =
            roles
                .into_iter()
                .fold(HashMap::new(), |mut acc: EventRolesMap, assignment| {
                    acc.entry(assignment.event_id)
                        .or_default()
                        .insert(assignment.role);

                    acc
                });

        Ok(roles_map)
    }

    pub async fn assign_event_roles(
        &self,
        event_id: Uuid,
        roles: EventRolesMap,
    ) -> ServiceResult<u64> {
        // Ensure event exists
        self.db_repo.get_event(event_id).await?;

        let mut active_role_assignments = Vec::new();

        for (user_id, roles) in roles {
            for role in roles {
                active_role_assignments.push(db_event_role_assignment::ActiveModel {
                    user_id: Set(user_id),
                    event_id: Set(event_id),
                    role: Set(role),
                });
            }
        }

        let result = db_event_role_assignment::Entity::insert_many(active_role_assignments)
            .on_conflict(
                OnConflict::columns(vec![
                    db_event_role_assignment::Column::UserId,
                    db_event_role_assignment::Column::EventId,
                    db_event_role_assignment::Column::Role,
                ])
                .do_nothing()
                .to_owned(),
            )
            .on_empty_do_nothing()
            .exec_without_returning(self.db_repo.conn())
            .await?;

        Ok(try_insert_result_to_int(result))
    }

    pub async fn unassign_event_roles(
        &self,
        event_id: Uuid,
        roles: EventRolesMap,
    ) -> ServiceResult<u64> {
        let mut rows_affected = 0;
        let txn = self.db_repo.conn().begin().await?;

        for (user_id, roles) in roles {
            for role in roles {
                let result = db_event_role_assignment::Entity::delete_many()
                    .filter(
                        Condition::all()
                            .add(db_event_role_assignment::Column::UserId.eq(user_id))
                            .add(db_event_role_assignment::Column::EventId.eq(event_id))
                            .add(db_event_role_assignment::Column::Role.eq(role)),
                    )
                    .exec(&txn)
                    .await?;

                rows_affected += result.rows_affected;
            }
        }

        let remaining_admins = db_event_role_assignment::Entity::find()
            .filter(db_event_role_assignment::Column::EventId.eq(event_id))
            .filter(db_event_role_assignment::Column::Role.eq(EventRole::Admin))
            .count(&txn)
            .await?;

        if remaining_admins == 0 {
            txn.rollback().await?;

            return Err(ServiceError::CannotUnassignAllAdmins {
                resource: "event".to_string(),
                id: event_id.to_string(),
            });
        }

        txn.commit().await?;

        Ok(rows_affected)
    }

    pub async fn get_event_affiliates(
        &self,
        event_id: Uuid,
        role: Option<EventRole>,
    ) -> ServiceResult<Vec<EventAffiliate>> {
        let affiliate_rows = db_user::Entity::find()
            .inner_join(db_event_role_assignment::Entity)
            .filter(db_event_role_assignment::Column::EventId.eq(event_id))
            .apply_if(role, |q, v| {
                q.filter(db_event_role_assignment::Column::Role.eq(v))
            })
            .select_only()
            .select_column(db_user::Column::Id)
            .select_column(db_user::Column::Name)
            .select_column(db_user::Column::Index)
            .select_column(db_event_role_assignment::Column::Role)
            .into_model::<AffiliateRow<EventRole>>()
            .all(self.db_repo.conn())
            .await?;

        let mut affiliates = affiliate_rows
            .into_iter()
            .fold(
                HashMap::new(),
                |mut acc: HashMap<Uuid, EventAffiliate>, row| {
                    let affiliate = acc.entry(row.id).or_insert(EventAffiliate {
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

    pub async fn count_event_affiliates(
        &self,
        event_id: Uuid,
        role: Option<EventRole>,
    ) -> ServiceResult<u64> {
        let count = db_user::Entity::find()
            .distinct()
            .inner_join(db_event_role_assignment::Entity)
            .filter(db_event_role_assignment::Column::EventId.eq(event_id))
            .apply_if(role, |q, v| {
                q.filter(db_event_role_assignment::Column::Role.eq(v))
            })
            .count(self.db_repo.conn())
            .await?;

        Ok(count)
    }
}
