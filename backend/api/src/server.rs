use crate::{ApiError, ApiResult};
use axum::extract::Request;
use axum::http::HeaderValue;
use axum::Router;
use itertools::iproduct;
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};

pub struct Server {
    name: &'static str,
    ip: IpAddr,
    port: u16,
    api_router: Router,
    docs_router: Router,
    allowed_origins: Option<Vec<String>>,
}

impl Server {
    pub fn new(
        name: &'static str,
        ip: IpAddr,
        port: u16,
        api_router: Router,
        docs_router: Router,
        allowed_origins: Option<Vec<String>>,
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

    fn build_cors_layer(&self) -> ApiResult<CorsLayer> {
        let default_allowed_hosts = vec![
            "localhost".to_string(),
            IpAddr::V4(Ipv4Addr::LOCALHOST).to_string(),
            self.ip.to_string(),
        ];

        let default_allowed_ports = vec![3000, self.port];

        let default_allowed_origins = iproduct!(default_allowed_hosts, default_allowed_ports)
            .map(|(ip, port)| format!("http://{ip}:{port}"))
            .collect::<Vec<_>>();

        let allowed_origins = self
            .allowed_origins
            .as_ref()
            .unwrap_or(&default_allowed_origins)
            .iter()
            .map(|origin| HeaderValue::from_str(origin))
            .collect::<Result<Vec<_>, _>>()?;

        let cors = CorsLayer::new()
            .allow_methods(Any)
            .allow_headers(Any)
            .allow_origin(allowed_origins)
            .allow_credentials(false);

        Ok(cors)
    }

    fn build_router(self) -> ApiResult<Router> {
        let cors = self.build_cors_layer()?;

        let mut router = Router::new().nest("/api", self.api_router);

        if cfg!(debug_assertions) {
            router = router.merge(self.docs_router);
        }

        router = router.fallback(handle_404).layer(cors);

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
