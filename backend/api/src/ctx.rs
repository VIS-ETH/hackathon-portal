use crate::error::{ApiError, ApiResult};
use axum::async_trait;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use services::ctx::Ctx as ServicesCtx;
use std::future::Future;
use std::pin::Pin;

#[derive(Debug, Clone)]
pub struct Ctx {
    srv_ctx: ServicesCtx,
}

// #[async_trait]
// impl<S: Send + Sync> FromRequestParts<S> for Ctx {
//     type Rejection = Error;
//
//     fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self>
//     {
//         // parts
//         //     .extensions
//         //     .get::<Result<Ctx>>()
//         //     .ok_or(Error::AuthNoCtxInRequest)
//         //     .clone()
//         todo!()
//     }
// }

impl From<Ctx> for ServicesCtx {
    fn from(ctx: Ctx) -> Self {
        ctx.srv_ctx
    }
}
