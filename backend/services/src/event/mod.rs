pub mod model;

use crate::ctx::{Ctx, User};
use crate::event::model::{
    CreateEventRequest, CreateEventResponse, GetEventResponse, GetEventRolesResponse,
    GetEventsResponse, GetEventsRolesResponse,
};
use crate::{ServiceError, ServiceResult};
use repositories::db::prelude::{db_event, db_event_role_assignment, EventPhase, EventRole};
use repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::sea_query::{Asterisk, IntoColumnRef};
use sea_orm::{
    ActiveModelTrait, Condition, FromQueryResult, QueryOrder, QuerySelect, SelectColumns, Set,
    TransactionTrait,
};
use slug::slugify;
use std::collections::HashMap;

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
        req: CreateEventRequest,
        ctx: &impl Ctx,
    ) -> ServiceResult<CreateEventResponse> {
        if !matches!(ctx.user(), User::Service) {
            return Err(ServiceError::ServiceUserRequired);
        }

        let slug = slugify(&req.name);
        let txn = self.db_repo.conn().begin().await?;

        let existing = db_event::Entity::find()
            .filter(
                Condition::any()
                    .add(db_event::Column::Name.eq(&req.name))
                    .add(db_event::Column::Slug.eq(&slug)),
            )
            .one(&txn)
            .await?;

        if let Some(existing) = existing {
            return if existing.slug == slug {
                Err(ServiceError::SlugNotUnique { slug })
            } else {
                Err(ServiceError::NameNotUnique { name: req.name })
            };
        }

        let active_event = db_event::ActiveModel {
            name: Set(req.name),
            slug: Set(slug),
            start: Set(req.start),
            end: Set(req.end),
            max_team_size: Set(req.max_team_size as i32),
            kdf_secret: Set(Uuid::new_v4().to_string()),
            is_feedback_visible: Set(false),
            is_hidden: Set(true),
            phase: Set(EventPhase::Registration),
            ..Default::default()
        };

        let event = db_event::Entity::insert(active_event)
            .exec_with_returning(&txn)
            .await?;

        txn.commit().await?;

        let response = CreateEventResponse { id: event.id };

        Ok(response)
    }

    pub async fn get_events(&self, ctx: &impl Ctx) -> ServiceResult<GetEventsResponse> {
        let condition = self.get_view_condition(ctx.user());

        let events = db_event::Entity::find()
            .left_join(db_event_role_assignment::Entity)
            .filter(condition)
            .distinct_on([
                db_event::Column::Id.into_column_ref(),
                db_event::Column::Start.into_column_ref(),
            ])
            .order_by_asc(db_event::Column::Start)
            .all(self.db_repo.conn())
            .await?;

        let response = GetEventsResponse {
            events: events.into_iter().map(|event| event.into()).collect(),
        };

        Ok(response)
    }

    pub async fn get_event(
        &self,
        event_id: Uuid,
        ctx: &impl Ctx,
    ) -> ServiceResult<GetEventResponse> {
        let condition = self.get_view_condition(ctx.user());

        let event = db_event::Entity::find()
            .left_join(db_event_role_assignment::Entity)
            .filter(condition)
            .filter(db_event::Column::Id.eq(event_id))
            .one(self.db_repo.conn())
            .await?;

        let Some(event) = event else {
            return Err(ServiceError::ResourceNotFound {
                resource: "Event".to_string(),
                id: event_id.to_string(),
            });
        };

        let response = GetEventResponse::from(event);

        Ok(response)
    }

    pub async fn get_events_roles(&self, ctx: &impl Ctx) -> ServiceResult<GetEventsRolesResponse> {
        let User::Regular(user) = ctx.user() else {
            return Err(ServiceError::RegularUserRequired);
        };

        let assignments = db_event_role_assignment::Entity::find()
            .filter(db_event_role_assignment::Column::UserId.eq(user.id))
            .all(self.db_repo.conn())
            .await?;

        let roles = assignments
            .into_iter()
            .fold(HashMap::new(), |mut acc, assignment| {
                acc.entry(assignment.event_id)
                    .or_insert_with(Vec::new)
                    .push(assignment.role);

                acc
            });

        let response = GetEventsRolesResponse { roles };

        Ok(response)
    }

    pub async fn get_event_roles(
        &self,
        event_id: Uuid,
        ctx: &impl Ctx,
    ) -> ServiceResult<GetEventRolesResponse> {
        let User::Regular(user) = ctx.user() else {
            return Err(ServiceError::RegularUserRequired);
        };

        let assignments = db_event_role_assignment::Entity::find()
            .filter(db_event_role_assignment::Column::EventId.eq(event_id))
            .filter(db_event_role_assignment::Column::UserId.eq(user.id))
            .all(self.db_repo.conn())
            .await?;

        let roles = assignments
            .into_iter()
            .map(|assignment| assignment.role)
            .collect();

        let response = GetEventRolesResponse { roles };

        Ok(response)
    }

    fn get_view_condition(&self, user: &User) -> Condition {
        match user {
            User::Service => Condition::all(),
            User::Regular(user) => {
                let participant_and_not_hidden = Condition::all()
                    .add(db_event::Column::IsHidden.eq(false))
                    .add(db_event_role_assignment::Column::UserId.eq(user.id))
                    .add(db_event_role_assignment::Column::Role.eq(EventRole::Participant));

                let staff = Condition::all()
                    .add(db_event_role_assignment::Column::UserId.eq(user.id))
                    .add(db_event_role_assignment::Column::Role.is_in(&[
                        EventRole::Admin.to_value(),
                        EventRole::Mentor.to_value(),
                        EventRole::Stakeholder.to_value(),
                        EventRole::SidequestMaster.to_value(),
                    ]));

                Condition::any().add(participant_and_not_hidden).add(staff)
            }
        }
    }
}
