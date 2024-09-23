use repositories::db::prelude::*;

#[derive(Debug, Clone)]
pub enum User {
    Service,
    Regular(db_user::Model),
}

#[derive(Debug, Clone)]
pub struct Ctx {
    user: User,
}

impl Ctx {
    pub fn new(user: User) -> Self {
        Self { user }
    }

    pub fn from_service() -> Self {
        Self {
            user: User::Service,
        }
    }

    pub fn from_regular(user: db_user::Model) -> Self {
        Self {
            user: User::Regular(user),
        }
    }

    pub fn user(&self) -> &User {
        &self.user
    }
}
