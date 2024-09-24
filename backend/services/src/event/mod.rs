pub mod default;
pub mod error;
pub mod model;

use crate::ctx::Ctx;
use crate::event::model::{CreateEventRequest, CreateEventResponse, ListEventsResponse};
pub use error::{Error, Result};
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, QueryOrder, TransactionTrait};

pub use default::DefaultEventService;

pub trait EventService: Send + Sync {
    async fn create(&self, ctx: &Ctx, req: CreateEventRequest) -> Result<CreateEventResponse>;
    async fn list(&self, ctx: &Ctx) -> Result<ListEventsResponse>;
}
