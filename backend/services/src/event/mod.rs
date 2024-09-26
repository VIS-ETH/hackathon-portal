pub mod model;

use crate::ctx::{ServiceCtx, User};
use crate::event::model::{
    EventForCreate, EventResponse, EventForPatch,
};
use crate::{ServiceError, ServiceResult};
use rand::distributions::Alphanumeric;
use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};
use repositories::db::prelude::{db_event, db_event_role_assignment, EventPhase, EventRole};
use repositories::db::sea_orm_active_enums::EventVisibility;
use repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::sea_query::OnConflict;
use sea_orm::{ActiveModelTrait, Condition, IntoActiveModel, QueryOrder, Set, TryInsertResult};
use slug::slugify;
use std::collections::{HashMap, HashSet};

#[derive(Clone)]
pub struct EventService {
    db_repo: DbRepository,
}

impl EventService {
    pub fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn create_event(
        &self,
        req: EventForCreate,
        ctx: &impl ServiceCtx,
    ) -> ServiceResult<EventResponse> {
        if !matches!(ctx.user(), User::Service) {
            return Err(ServiceError::ServiceUserRequired);
        }

        self.check_event_name_conflict(&req.name).await?;

        let slug = slugify(&req.name);
        let kdf_secret = self.generate_kdf_secret();

        let active_event = db_event::ActiveModel {
            name: Set(req.name),
            slug: Set(slug),
            start: Set(req.start),
            end: Set(req.end),
            max_team_size: Set(req.max_team_size as i32),
            kdf_secret: Set(kdf_secret),
            is_feedback_visible: Set(false),
            visibility: Set(EventVisibility::Private),
            phase: Set(EventPhase::Registration),
            ..Default::default()
        };

        let event = db_event::Entity::insert(active_event)
            .exec_with_returning(self.db_repo.conn())
            .await?;

        let response = EventResponse::from(event);

        Ok(response)
    }

    pub async fn get_events(&self, ctx: &impl ServiceCtx) -> ServiceResult<Vec<EventResponse>> {
        let events = db_event::Entity::find()
            .order_by_asc(db_event::Column::Start)
            .all(self.db_repo.conn())
            .await?;

        let events = events
            .into_iter()
            .filter(|event| self.can_view_event(ctx.user(), event))
            .map(|event| EventResponse::from(event))
            .collect::<Vec<_>>();

        Ok(events)
    }

    pub async fn get_event(
        &self,
        event_id: Uuid,
        ctx: &impl ServiceCtx,
    ) -> ServiceResult<EventResponse> {
        let event = db_event::Entity::find()
            .filter(db_event::Column::Id.eq(event_id))
            .one(self.db_repo.conn())
            .await?
            .ok_or_else(|| ServiceError::ResourceNotFound {
                resource: "Event".to_string(),
                id: event_id.to_string(),
            })?;

        if !self.can_view_event(ctx.user(), &event) {
            return Err(ServiceError::Forbidden {
                resource: "Event".to_string(),
                id: event_id.to_string(),
                action: "view".to_string(),
            });
        }

        let response = EventResponse::from(event);

        Ok(response)
    }

    pub async fn patch_event(
        &self,
        event_id: Uuid,
        patch: &EventForPatch,
        ctx: &impl ServiceCtx,
    ) -> ServiceResult<EventResponse> {
        let event = db_event::Entity::find()
            .filter(db_event::Column::Id.eq(event_id))
            .one(self.db_repo.conn())
            .await?
            .ok_or_else(|| ServiceError::ResourceNotFound {
                resource: "Event".to_string(),
                id: event_id.to_string(),
            })?;

        if !self.can_modify_event(ctx.user(), &event) {
            return Err(ServiceError::Forbidden {
                resource: "Event".to_string(),
                id: event_id.to_string(),
                action: "modify".to_string(),
            });
        }

        let mut active_event = event.into_active_model();

        if let Some(name) = &patch.name {
            self.check_event_name_conflict(name).await?;
            active_event.name = Set(name.clone());
            active_event.slug = Set(slugify(name));
        }

        if let Some(start) = patch.start {
            active_event.start = Set(start);
        }

        if let Some(end) = patch.end {
            active_event.end = Set(end);
        }

        if let Some(max_team_size) = patch.max_team_size {
            active_event.max_team_size = Set(max_team_size as i32);
        }

        if let Some(is_feedback_visible) = patch.is_feedback_visible {
            active_event.is_feedback_visible = Set(is_feedback_visible);
        }

        if let Some(visibility) = &patch.visibility {
            active_event.visibility = Set(visibility.clone());
        }

        if let Some(phase) = &patch.phase {
            active_event.phase = Set(phase.clone());
        }

        let event = active_event.update(self.db_repo.conn()).await?;

        let response = EventResponse::from(event);

        Ok(response)
    }

    pub async fn add_event_role_assignments(
        &self,
        event_id: Uuid,
        roles: HashMap<Uuid, HashSet<EventRole>>,
        ctx: &impl ServiceCtx,
    ) -> ServiceResult<u64> {
        let event = db_event::Entity::find()
            .filter(db_event::Column::Id.eq(event_id))
            .one(self.db_repo.conn())
            .await?
            .ok_or_else(|| ServiceError::ResourceNotFound {
                resource: "Event".to_string(),
                id: event_id.to_string(),
            })?;

        if !self.can_modify_event(ctx.user(), &event) {
            return Err(ServiceError::Forbidden {
                resource: "Event".to_string(),
                id: event_id.to_string(),
                action: "modify".to_string(),
            });
        }

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

        let rows_affected = match result {
            TryInsertResult::Empty => 0,
            TryInsertResult::Conflicted => 0,
            TryInsertResult::Inserted(n) => n,
        };

        Ok(rows_affected)
    }


    pub async fn remove_event_role_assignments(
        &self,
        event_id: Uuid,
        roles: HashMap<Uuid, HashSet<EventRole>>,
        ctx: &impl ServiceCtx,
    ) -> ServiceResult<u64> {
        let event = db_event::Entity::find()
            .filter(db_event::Column::Id.eq(event_id))
            .one(self.db_repo.conn())
            .await?
            .ok_or_else(|| ServiceError::ResourceNotFound {
                resource: "Event".to_string(),
                id: event_id.to_string(),
            })?;

        if !self.can_modify_event(ctx.user(), &event) {
            return Err(ServiceError::Forbidden {
                resource: "Event".to_string(),
                id: event_id.to_string(),
                action: "modify".to_string(),
            });
        }

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

    fn can_view_event(&self, user: &User, event: &db_event::Model) -> bool {
        match user {
            User::Service => true,
            User::Regular { events_roles, .. } => match event.visibility {
                EventVisibility::Private => events_roles.get(&event.id).is_some_and(|roles| {
                    roles.contains(&EventRole::Admin)
                        || roles.contains(&EventRole::Mentor)
                        || roles.contains(&EventRole::Stakeholder)
                        || roles.contains(&EventRole::SidequestMaster)
                }),
                EventVisibility::Restricted => events_roles
                    .get(&event.id)
                    .is_some_and(|roles| !roles.is_empty()),
                EventVisibility::Public => true,
            },
        }
    }

    fn can_modify_event(&self, user: &User, event: &db_event::Model) -> bool {
        match user {
            User::Service => true,
            User::Regular { events_roles, .. } => events_roles
                .get(&event.id)
                .is_some_and(|roles| roles.contains(&EventRole::Admin)),
        }
    }

    fn generate_kdf_secret(&self) -> String {
        let rng = StdRng::from_entropy();
        rng.sample_iter(&Alphanumeric)
            .take(32)
            .map(char::from)
            .collect::<String>()
    }

    async fn check_event_name_conflict(&self, name: &str) -> ServiceResult<()> {
        let slug = slugify(name);

        let existing = db_event::Entity::find()
            .filter(
                Condition::any()
                    .add(db_event::Column::Name.eq(name))
                    .add(db_event::Column::Slug.eq(&slug)),
            )
            .one(self.db_repo.conn())
            .await?;

        if let Some(existing) = existing {
            return if existing.slug == slug {
                Err(ServiceError::SlugNotUnique { slug })
            } else {
                Err(ServiceError::NameNotUnique {
                    name: name.to_string(),
                })
            };
        }

        Ok(())
    }
}
