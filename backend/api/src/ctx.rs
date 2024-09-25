use crate::error::PublicResult;
use crate::{ApiError, PublicError};
use axum::async_trait;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use services::ctx::{Ctx as ServicesCtx, User};

#[derive(Debug, Clone)]
pub struct Ctx {
    srv_ctx: ServicesCtx,
}

impl Ctx {
    pub fn new(srv_ctx: ServicesCtx) -> Self {
        Self { srv_ctx }
    }

    pub fn user(&self) -> &User {
        self.srv_ctx.user()
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for Ctx
where
    S: Send + Sync,
{
    type Rejection = PublicError;

    async fn from_request_parts(parts: &mut Parts, _: &S) -> PublicResult<Self> {
        let ctx = parts
            .extensions
            .get::<Option<Ctx>>()
            .ok_or_else(|| PublicError::from(ApiError::NoCtxInRequest))?
            .as_ref()
            .ok_or_else(|| PublicError::from(ApiError::NoCtxInRequest))?
            .clone();

        Ok(ctx)
    }
}

impl From<Ctx> for ServicesCtx {
    fn from(ctx: Ctx) -> Self {
        ctx.srv_ctx
    }
}
