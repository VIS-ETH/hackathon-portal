use crate::error::PublicError;
use crate::mw::{mw_check_origin, mw_log_request};
use crate::{ApiError, ApiResult};
use axum::extract::Request;
use axum::http::{HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::{middleware, Router};
use std::net::{IpAddr, SocketAddr};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::catch_panic::CatchPanicLayer;
use tower_http::cors::{Any, CorsLayer};
use tracing::error;

pub struct Server {
    name: &'static str,
    ip: IpAddr,
    port: u16,
    api_router: Router,
    docs_router: Router,
    allowed_origins: Vec<String>,
}

impl Server {
    pub fn new(
        name: &'static str,
        ip: IpAddr,
        port: u16,
        api_router: Router,
        docs_router: Router,
        allowed_origins: Vec<String>,
    ) -> Self {
        Self {
            name,
            ip,
            port,
            api_router,
            docs_router,
            allowed_origins,
        }
    }

    fn build_router(self) -> ApiResult<Router> {
        let allowed_origins = self
            .allowed_origins
            .iter()
            .map(|origin| HeaderValue::from_str(origin))
            .collect::<Result<Vec<_>, _>>()?;

        let cors = CorsLayer::new()
            .allow_methods(Any)
            .allow_headers(Any)
            .allow_origin(allowed_origins.clone())
            .allow_credentials(false);

        let mut router = Router::new().nest("/api", self.api_router);

        if cfg!(debug_assertions) {
            router = router.merge(self.docs_router);
        }

        router = router
            .fallback(handle_404)
            // Inside the logger, so panics are logged as 500s instead of dropping the connection.
            .layer(CatchPanicLayer::custom(handle_panic))
            .layer(middleware::from_fn_with_state(
                Arc::<[HeaderValue]>::from(allowed_origins),
                mw_check_origin,
            ))
            .layer(middleware::from_fn(mw_log_request))
            .layer(cors);

        Ok(router)
    }

    pub async fn serve(self) -> ApiResult<()> {
        let addr = SocketAddr::new(self.ip, self.port);
        let listener = TcpListener::bind(&addr).await?;

        let name = self.name;
        let router = self.build_router()?;

        tracing::info!(
            "{} listening on http://{}/api, docs on http://{}/docs",
            name,
            addr,
            addr
        );

        axum::serve(listener, router).await?;

        Ok(())
    }
}

async fn handle_404(request: Request) -> ApiResult<()> {
    Err(ApiError::UrlNotFound {
        url: request.uri().to_string(),
    })
}

#[expect(
    clippy::needless_pass_by_value,
    reason = "signature required by tower_http's ResponseForPanic"
)]
fn handle_panic(err: Box<dyn std::any::Any + Send + 'static>) -> Response {
    let message = err
        .downcast_ref::<String>()
        .map(String::as_str)
        .or_else(|| err.downcast_ref::<&str>().copied())
        .unwrap_or("unknown panic payload");

    error!(panic = message, "Request handler panicked");

    PublicError::new(StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{header, Method};
    use axum::routing::get;
    use std::net::Ipv4Addr;
    use tower::ServiceExt;

    const PORTAL: &str = "https://hackathon.ethz.ch";
    const TEAM: &str = "https://01.hackathon.ethz.ch";

    fn router(allowed_origins: &[&str]) -> Router {
        let api_router = Router::new().route("/ping", get(|| async {}).post(|| async {}));

        Server::new(
            "test",
            IpAddr::V4(Ipv4Addr::LOCALHOST),
            8000,
            api_router,
            Router::new(),
            allowed_origins.iter().map(ToString::to_string).collect(),
        )
        .build_router()
        .expect("router builds")
    }

    async fn send(router: Router, method: Method, origin: Option<&str>) -> Response {
        let mut request = Request::builder().method(method).uri("/api/ping");

        if let Some(origin) = origin {
            request = request.header(header::ORIGIN, origin);
        }

        router
            .oneshot(request.body(Body::empty()).expect("request builds"))
            .await
            .expect("router is infallible")
    }

    #[tokio::test]
    async fn rejects_cross_site_writes() {
        let router = router(&[PORTAL]);

        let res = send(router, Method::POST, Some(TEAM)).await;
        assert_eq!(res.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn accepts_writes_from_allowed_origins_and_non_browsers() {
        let router = router(&[PORTAL]);

        let res = send(router.clone(), Method::POST, Some(PORTAL)).await;
        assert_eq!(res.status(), StatusCode::OK);

        let res = send(router, Method::POST, None).await;
        assert_eq!(res.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn answers_cors_preflights() {
        let router = router(&[PORTAL]);

        let request = Request::builder()
            .method(Method::OPTIONS)
            .uri("/api/ping")
            .header(header::ORIGIN, PORTAL)
            .header(header::ACCESS_CONTROL_REQUEST_METHOD, "POST")
            .body(Body::empty())
            .expect("request builds");
        let res = router.oneshot(request).await.expect("router is infallible");

        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers().get(header::ACCESS_CONTROL_ALLOW_ORIGIN),
            Some(&HeaderValue::from_static(PORTAL))
        );
    }

    /// Cross-site reads reach the handler, but without CORS headers the browser hides the response.
    #[tokio::test]
    async fn hides_cross_site_reads() {
        let router = router(&[PORTAL]);

        let res = send(router.clone(), Method::GET, Some(TEAM)).await;
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(res.headers().get(header::ACCESS_CONTROL_ALLOW_ORIGIN), None);
        assert_eq!(
            res.headers().get(header::ACCESS_CONTROL_ALLOW_CREDENTIALS),
            None
        );

        let res = send(router, Method::GET, Some(PORTAL)).await;
        assert_eq!(
            res.headers().get(header::ACCESS_CONTROL_ALLOW_ORIGIN),
            Some(&HeaderValue::from_static(PORTAL))
        );
        // without it, the browser hides credentialed responses even from allowed origins
        assert_eq!(
            res.headers().get(header::ACCESS_CONTROL_ALLOW_CREDENTIALS),
            None
        );
    }

    #[tokio::test]
    async fn accepts_writes_from_every_configured_origin() {
        let router = router(&["http://localhost:3000", "http://localhost:8000"]);

        let res = send(router.clone(), Method::POST, Some("http://localhost:3000")).await;
        assert_eq!(res.status(), StatusCode::OK);

        let res = send(router.clone(), Method::POST, Some("http://localhost:8000")).await;
        assert_eq!(res.status(), StatusCode::OK);

        let res = send(router, Method::POST, Some("http://127.0.0.1:3000")).await;
        assert_eq!(res.status(), StatusCode::FORBIDDEN);
    }
}
