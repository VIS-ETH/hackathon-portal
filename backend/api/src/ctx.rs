use crate::{ApiError, ApiResult};
use axum::async_trait;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use services::ctx::{ServiceCtx as ServicesCtx, User};

#[derive(Debug, Clone)]
pub struct Ctx {
    user: User,
}

impl Ctx {
    pub fn new(user: User) -> Self {
        Self { user }
    }
}

impl ServicesCtx for Ctx {
    fn user(&self) -> &User {
        &self.user
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
            .get::<Option<Ctx>>()
            .ok_or_else(|| ApiError::NoCtxInRequest)?
            .as_ref()
            .ok_or_else(|| ApiError::NoCtxInRequest)?
            .clone();

        Ok(ctx)
    }
}
