pub mod model;

use crate::ctx::{Ctx, User};
use crate::event::model::{CreateEventRequest, CreateEventResponse, ListEventsResponse};
use repositories::db::prelude::*;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, QueryOrder, Set, TransactionTrait};

use repositories::db::prelude::{db_event, EventPhase};
use repositories::DbRepository;
use crate::ServiceResult;

#[derive(Clone)]
pub struct UserService {
    db_repo: DbRepository,
}

impl UserService {
    pub fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn get_or_create(&self, auth_id: &str) -> ServiceResult<db_user::Model> {
        let user = db_user::Entity::find()
            .filter(db_user::Column::AuthId.eq(auth_id))
            .one(self.db_repo.conn())
            .await?;

        if let Some(user) = user {
            return Ok(user);
        }

        let name = auth_id.split('@').next().unwrap_or("Unknown");

        let active_user = db_user::ActiveModel {
            auth_id: Set(auth_id.to_string()),
            name: Set(name.to_string()),
            ..Default::default()
        };

        let user = db_user::Entity::insert(active_user)
            .exec_with_returning(self.db_repo.conn())
            .await?;

        Ok(user)
    }

    pub async fn create(
        &self,
        req: CreateEventRequest,
        auth_ctx: &Ctx,
    ) -> ServiceResult<CreateEventResponse> {
        if !matches!(auth_ctx.user(), User::Service) {
            // return Err(Error::Unauthorized);
            todo!()
        }

        let txn = self.db_repo.conn().begin().await.unwrap();

        let existing = db_event::Entity::find()
            .filter(db_event::Column::Name.contains(&req.name))
            .one(&txn)
            .await
            .unwrap();

        if existing.is_some() {
            // return Err(Error::Conflict);
            todo!()
        }

        let active_event = db_event::ActiveModel {
            name: Set(req.name),
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
            .await
            .unwrap();

        txn.commit().await.unwrap();

        let response = CreateEventResponse { id: event.id };

        Ok(response)
    }

    pub async fn list(&self, auth_ctx: &Ctx) -> ServiceResult<ListEventsResponse> {
        // let User::Regular(user) = ctx.user() else {
        let events = db_event::Entity::find()
            .order_by_asc(db_event::Column::Start)
            .all(self.db_repo.conn())
            .await
            .unwrap();

        let response = ListEventsResponse {
            events: events.into_iter().map(|event| event.into()).collect(),
        };

        Ok(response)
        // };

        // let events_with_roles: Vec<(db_event::Model, Vec<db_event_role_assignment::Model>)> = db_event::Entity::find()
        //     .find_with_related(db_event_role_assignment::Relation::)
        //     .order_by_asc(db_event::Column::Start)
        //     .all(db_repo.conn())
        //     .await
        //     .unwrap();
        //
        // let events = events_with_roles.into_iter().filter(|(event, roles)| {
        //     Self::can_view_event_with_roles(event, roles)
        // }).map(|(event, _)| event).collect();

        // let events = vec![];
        //
        // let response = ListEventsResponse {
        //     events: events.into_iter().map(|event| event.into()).collect(),
        // };
        //
        // Ok(response)
    }
}
