use crate::{ApiError, ApiResult};
use axum::extract::{FromRequestParts, OptionalFromRequestParts};
use axum::http::request::Parts;
use hackathon_portal_services::authorization::models::UserRoles;
use hackathon_portal_services::user::models::User;
use std::convert::Infallible;
use std::future::{ready, Future};

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

    /// The context resolved by `mw_resolve_ctx`, if the request is authenticated.
    fn from_parts(parts: &Parts) -> Option<Self> {
        parts.extensions.get::<Option<Self>>().cloned().flatten()
    }
}

impl<S> FromRequestParts<S> for Ctx
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    fn from_request_parts(
        parts: &mut Parts,
        _: &S,
    ) -> impl Future<Output = ApiResult<Self>> + Send {
        ready(Self::from_parts(parts).ok_or(ApiError::NoCtxInRequest))
    }
}

/// Lets handlers and middleware take `Option<Ctx>`, which is `None` for anonymous requests.
impl<S> OptionalFromRequestParts<S> for Ctx
where
    S: Send + Sync,
{
    type Rejection = Infallible;

    fn from_request_parts(
        parts: &mut Parts,
        _: &S,
    ) -> impl Future<Output = Result<Option<Self>, Infallible>> + Send {
        ready(Ok(Self::from_parts(parts)))
    }
}
