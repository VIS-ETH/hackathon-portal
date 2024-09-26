pub mod model;

use crate::ctx::{ServiceCtx, User};
use crate::event::model::{
    CreateEventRequest, GetEventResponse, GetEventRolesResponse, GetEventsResponse,
    GetEventsRolesResponse, PatchEventRequest,
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
        ctx: &impl ServiceCtx,
    ) -> ServiceResult<GetEventResponse> {
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

        let response = GetEventResponse::from(event);

        Ok(response)
    }

    pub async fn get_events(&self, ctx: &impl ServiceCtx) -> ServiceResult<GetEventsResponse> {
        let condition = self.view_event_condition(ctx.user());

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
        ctx: &impl ServiceCtx,
    ) -> ServiceResult<GetEventResponse> {
        let condition = self.view_event_condition(ctx.user());

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

    pub async fn patch_event(
        &self,
        event_id: Uuid,
        patch: &PatchEventRequest,
        ctx: &impl ServiceCtx,
    ) -> ServiceResult<GetEventResponse> {
        let condition = self.view_event_condition(ctx.user());

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

    fn can_view_event(&self, user: &User, event: &db_event::Model) -> bool {
        match user {
            User::Service => true,
            User::Regular {
                user,
                events_roles,
                teams_roles,
            } => {
                todo!()
            }
        }
    }

    fn view_event_condition(&self, user: &User) -> Condition {
        todo!()
        // match user {
        //     User::Service => Condition::all(),
        //     User::Regular(user) => {
        //         let participant_and_not_hidden = Condition::all()
        //             .add(db_event::Column::IsHidden.eq(false))
        //             .add(db_event_role_assignment::Column::UserId.eq(user.id))
        //             .add(db_event_role_assignment::Column::Role.eq(EventRole::Participant));
        //
        //         let staff = Condition::all()
        //             .add(db_event_role_assignment::Column::UserId.eq(user.id))
        //             .add(db_event_role_assignment::Column::Role.is_in(&[
        //                 EventRole::Admin.to_value(),
        //                 EventRole::Mentor.to_value(),
        //                 EventRole::Stakeholder.to_value(),
        //                 EventRole::SidequestMaster.to_value(),
        //             ]));
        //
        //         Condition::any().add(participant_and_not_hidden).add(staff)
        //     }
        // }
    }
}
