use crate::api_state::ApiState;
use axum::body::Body;
use axum::extract::Request;
use axum::extract::{FromRequestParts, State};
use axum::http::{HeaderValue, StatusCode};
use axum::middleware::Next;
use axum::response::Response;
use services::ctx::Ctx;

const AUTH_ID_KEY: &str = "X-Authentik-Email";

//
// pub fn mw_impersonate_factory(
//     target_user_auth_id: String,
// ) -> impl Fn(Request<Body>, Next) -> Response {
//     move |mut req: Request<Body>, next: Next| {
//         req.headers_mut().insert(
//             AUTH_ID_KEY,
//             target_user_auth_id.parse().unwrap(),
//         );
//
//         next.run(req)
//     }
// }

pub async fn mw_impersonate(mut req: Request<Body>, next: Next) -> Result<Response, StatusCode> {
    let target_id = "hannes.eberhard@hotmail.com";

    req.headers_mut().insert(
        AUTH_ID_KEY,
        HeaderValue::from_str(&target_id).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
    );

    Ok(next.run(req).await)
}

pub async fn mw_require_auth(
    // ctx: Result<Ctx>,
    req: Request,
    next: Next,
) -> Response {
    println!("->> {:<12} - mw_require_auth", "MIDDLEWARE");
    // println!("->> {:<12} - mw_require_auth - {ctx:?}", "MIDDLEWARE");

    // ctx?;

    // Ok(next.run(req).await)
    next.run(req).await
}

pub async fn mw_resolve_ctx(
    State(state): State<ApiState>,
    mut req: Request<Body>,
    next: Next,
) -> Response {
    println!("->> {:<12} - mw_ctx_resolver", "MIDDLEWARE");
    //
    // let auth_token = cookies.get(AUTH_TOKEN).map(|c| c.value().to_string());
    //
    // // Compute Result<Ctx>.
    // let result_ctx = match auth_token
    //     .ok_or(Error::AuthFailNoAuthTokenCookie)
    //     .and_then(parse_token)
    // {
    //     Ok((user_id, _exp, _sign)) => {
    //         // TODO: Token components validations.
    //         Ok(Ctx::new(user_id))
    //     }
    //     Err(e) => Err(e),
    // };
    //
    // // Remove the cookie if something went wrong other than NoAuthTokenCookie.
    // if result_ctx.is_err()
    //     && !matches!(result_ctx, Err(Error::AuthFailNoAuthTokenCookie))
    // {
    //     cookies.remove(Cookie::from(AUTH_TOKEN))
    // }
    //
    // // Store the ctx_result in the request extension.
    // req.extensions_mut().insert(result_ctx);

    // Ok(next.run(req).await)
    next.run(req).await
}

async fn my_middleware(request: Request, next: Next) -> Response {
    // do something with `request`...

    let response = next.run(request).await;

    // do something with `response`...

    response
}
