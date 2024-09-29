pub mod model;

use crate::authorization::model::{
    AffiliateRow, EventRolesMap, TeamAffiliate, TeamRolesMap, UserRoles,
};
use crate::utils::try_insert_result_to_int;
use crate::{ServiceError, ServiceResult};
use repositories::db::prelude::*;
use repositories::db::prelude::{
    db_event, db_event_role_assignment, db_team_role_assignment, EventRole,
};
use repositories::db::sea_orm_active_enums::EventVisibility;
use repositories::DbRepository;
use sea_orm::sea_query::OnConflict;
use sea_orm::{prelude::*, QueryOrder, QuerySelect, QueryTrait, SelectColumns};
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

    pub async fn assign_team_roles(
        &self,
        team_id: Uuid,
        roles: TeamRolesMap,
    ) -> ServiceResult<u64> {
        db_team::Entity::find()
            .filter(db_team::Column::Id.eq(team_id))
            .one(self.db_repo.conn())
            .await?
            .ok_or_else(|| ServiceError::ResourceNotFound {
                resource: "team".to_string(),
                id: team_id.to_string(),
            })?;

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

        let result = db_team_role_assignment::Entity::insert_many(active_role_assignments)
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
            .exec_without_returning(self.db_repo.conn())
            .await?;

        Ok(try_insert_result_to_int(result))
    }

    pub async fn unassign_team_roles(
        &self,
        team_id: Uuid,
        roles: TeamRolesMap,
    ) -> ServiceResult<u64> {
        let mut rows_affected = 0;

        for (user_id, roles) in roles {
            for role in roles {
                let result = db_team_role_assignment::Entity::delete_many()
                    .filter(
                        Condition::all()
                            .add(db_team_role_assignment::Column::UserId.eq(user_id))
                            .add(db_team_role_assignment::Column::TeamId.eq(team_id))
                            .add(db_team_role_assignment::Column::Role.eq(role)),
                    )
                    .exec(self.db_repo.conn())
                    .await?;

                rows_affected += result.rows_affected;
            }
        }

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
                        name: row.name,
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

    pub fn write_project_guard(&self, roles: &UserRoles, event_id: Uuid) -> ServiceResult<()> {
        let event_roles = roles.event.get(&event_id);
        let pass = event_roles.is_some_and(|roles| {
            roles.contains(&EventRole::Admin) || roles.contains(&EventRole::Stakeholder)
        });

        if pass {
            Ok(())
        } else {
            Err(ServiceError::Forbidden {
                resource: "event".to_string(),
                id: event_id.to_string(),
                action: "write project".to_string(),
            })
        }
    }

    // Sidequests

    pub fn edit_sidequests_guard(&self, roles: &UserRoles, event_id: Uuid) -> ServiceResult<()> {
        let event_roles = roles.event.get(&event_id);
        let pass = event_roles.is_some_and(|roles| roles.contains(&EventRole::Admin));

        if pass {
            Ok(())
        } else {
            Err(ServiceError::Forbidden {
                resource: "event".to_string(),
                id: event_id.to_string(),
                action: "edit sidequests".to_string(),
            })
        }
    }

    pub fn edit_sidequests_attempt_guard(
        &self,
        roles: &UserRoles,
        event_id: Uuid,
    ) -> ServiceResult<()> {
        let event_roles = roles.event.get(&event_id);
        let pass = event_roles.is_some_and(|roles| {
            roles.contains(&EventRole::Admin) || roles.contains(&EventRole::SidequestMaster)
        });

        if pass {
            Ok(())
        } else {
            Err(ServiceError::Forbidden {
                resource: "event".to_string(),
                id: event_id.to_string(),
                action: "edit sidequests".to_string(),
            })
        }
    }

    pub async fn allowed_attempt(&self, user_id: Uuid, event_id: Uuid) -> ServiceResult<()> {
        let all_sidequests = db_sidequest::Entity::find()
            .filter(db_sidequest::Column::EventId.eq(event_id))
            .all(self.db_repo.conn())
            .await?;

        let ids = all_sidequests
            .iter()
            .map(|sidequest| sidequest.id)
            .collect::<Vec<Uuid>>();

        // get the maximum
        let last_attempt = db_sidequest_attempt::Entity::find()
            .filter(db_sidequest_attempt::Column::UserId.eq(user_id))
            .filter(db_sidequest_attempt::Column::SidequestId.is_in(ids))
            .order_by_desc(db_sidequest_attempt::Column::AttemptedAt)
            .one(self.db_repo.conn())
            .await?;

        match last_attempt {
            None => Ok(()),
            Some(attempt) => {
                let now = chrono::Utc::now().naive_utc();
                let last_attempt = attempt.attempted_at;
                let diff = now - last_attempt;
                if diff.num_minutes() > 60 {
                    Ok(())
                } else {
                    let allowed_next = last_attempt + chrono::Duration::minutes(60); // TODO
                    Err(ServiceError::SidequestCooldown {
                        allowed_at: (allowed_next),
                    })
                }
            }
        }
    }
}
