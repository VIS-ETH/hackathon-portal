pub mod model;

use crate::authorization::model::{EventRolesMap, TeamRolesMap, UserRoles};
use crate::utils::try_insert_result_to_int;
use crate::{ServiceError, ServiceResult};
use repositories::db::prelude::*;
use repositories::db::prelude::{
    db_event, db_event_role_assignment, db_team_role_assignment, EventRole,
};
use repositories::db::sea_orm_active_enums::EventVisibility;
use repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::sea_query::OnConflict;
use sea_orm::{Condition, Set};
use std::collections::{HashMap, HashSet};

#[derive(Clone)]
pub struct AuthorizationService {
    db_repo: DbRepository,
}

impl AuthorizationService {
    pub fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn get_event_roles(&self, user_id: Uuid) -> ServiceResult<EventRolesMap> {
        let roles = db_event_role_assignment::Entity::find()
            .filter(db_event_role_assignment::Column::UserId.eq(user_id))
            .all(self.db_repo.conn())
            .await?;

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

    pub async fn get_team_roles(&self, user_id: Uuid) -> ServiceResult<TeamRolesMap> {
        let roles = db_team_role_assignment::Entity::find()
            .filter(db_team_role_assignment::Column::UserId.eq(user_id))
            .all(self.db_repo.conn())
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

    pub async fn get_roles(&self, user_id: Uuid) -> ServiceResult<UserRoles> {
        let response = UserRoles {
            event: self.get_event_roles(user_id).await?,
            team: self.get_team_roles(user_id).await?,
        };

        Ok(response)
    }

    pub async fn assign_event_roles(
        &self,
        event_id: Uuid,
        roles: EventRolesMap,
    ) -> ServiceResult<u64> {
        db_event::Entity::find()
            .filter(db_event::Column::Id.eq(event_id))
            .one(self.db_repo.conn())
            .await?
            .ok_or_else(|| ServiceError::ResourceNotFound {
                resource: "event".to_string(),
                id: event_id.to_string(),
            })?;

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

    pub async fn assign_default_event_roles(
        &self,
        event_id: Uuid,
        auth_ids: Vec<String>,
        roles: HashSet<EventRole>,
    ) -> ServiceResult<u64> {
        let users = db_user::Entity::find()
            .filter(db_user::Column::AuthId.is_in(auth_ids))
            .all(self.db_repo.conn())
            .await?;

        let roles_map = users
            .into_iter()
            .map(|user| (user.id, roles.clone()))
            .collect::<EventRolesMap>();

        self.assign_event_roles(event_id, roles_map).await
    }

    pub async fn unassign_event_roles(
        &self,
        event_id: Uuid,
        roles: EventRolesMap,
    ) -> ServiceResult<u64> {
        let mut rows_affected = 0;

        for (user_id, roles) in roles {
            for role in roles {
                let result = db_event_role_assignment::Entity::delete_many()
                    .filter(
                        Condition::all()
                            .add(db_event_role_assignment::Column::UserId.eq(user_id))
                            .add(db_event_role_assignment::Column::EventId.eq(event_id))
                            .add(db_event_role_assignment::Column::Role.eq(role)),
                    )
                    .exec(self.db_repo.conn())
                    .await?;

                rows_affected += result.rows_affected;
            }
        }

        Ok(rows_affected)
    }

    pub fn view_event_guard(
        &self,
        roles: &UserRoles,
        event_id: Uuid,
        event_visibility: EventVisibility,
    ) -> ServiceResult<()> {
        let event_roles = roles.event.get(&event_id);

        let pass = match event_visibility {
            EventVisibility::Private => event_roles.is_some_and(|roles| {
                roles.contains(&EventRole::Admin)
                    || roles.contains(&EventRole::Mentor)
                    || roles.contains(&EventRole::Stakeholder)
                    || roles.contains(&EventRole::SidequestMaster)
            }),
            EventVisibility::Restricted => event_roles.is_some_and(|roles| !roles.is_empty()),
            EventVisibility::Public => true,
        };

        if pass {
            Ok(())
        } else {
            Err(ServiceError::Forbidden {
                resource: "event".to_string(),
                id: event_id.to_string(),
                action: "view".to_string(),
            })
        }
    }

    pub fn edit_event_guard(&self, roles: &UserRoles, event_id: Uuid) -> ServiceResult<()> {
        let event_roles = roles.event.get(&event_id);
        let pass = event_roles.is_some_and(|roles| roles.contains(&EventRole::Admin));

        if pass {
            Ok(())
        } else {
            Err(ServiceError::Forbidden {
                resource: "event".to_string(),
                id: event_id.to_string(),
                action: "edit".to_string(),
            })
        }
    }

    pub fn can_view_team_reduced(
        &self,
        _roles: &UserRoles,
        _event: &db_event::Model,
        _team_id: Uuid,
    ) -> bool {
        todo!()
    }

    pub fn can_view_team_secrets(&self) -> bool {
        todo!()
    }
}
