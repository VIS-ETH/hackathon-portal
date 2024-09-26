use repositories::db::prelude::*;

#[derive(Debug, Clone)]
pub enum User {
    Service,
    Regular(db_user::Model),
}

pub trait Ctx: Send + Sync {
    fn user(&self) -> &User;
}
