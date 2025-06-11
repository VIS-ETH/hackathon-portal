use crate::{ApiError, ApiResult};
use axum::async_trait;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use hackathon_portal_services::authorization::models::UserRoles;
use hackathon_portal_services::user::models::User;

#[derive(Debug, Clone)]
pub struct Ctx {
    user: User,
    roles: UserRoles,
}

impl Ctx {
    pub fn new(user: User, roles: UserRoles) -> Self {
        Self { user, roles }
    }

    pub fn user(&self) -> &User {
        &self.user
    }

    pub fn roles(&self) -> &UserRoles {
        &self.roles
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for Ctx
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, _: &S) -> ApiResult<Self> {
        let ctx = parts
            .extensions
            .get::<Option<Self>>()
            .ok_or_else(|| ApiError::NoCtxInRequest)?
            .as_ref()
            .ok_or_else(|| ApiError::NoCtxInRequest)?
            .clone();

        Ok(ctx)
    }
}
