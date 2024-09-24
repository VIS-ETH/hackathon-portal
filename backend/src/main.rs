mod api;
mod appState;
mod config;
mod docs;
mod entity;
mod error;

use crate::config::BackendConfig;
use crate::docs::ApiDocs;
use appState::create;
use axum::{routing::get, Json, Router};
use http::Method;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

#[tokio::main]
async fn main() {
    let config_path = "Config.toml";
    let config = BackendConfig::new(config_path).unwrap();

    let socket_address = std::format!("127.0.0.1:{}", config.port);
    let listener = tokio::net::TcpListener::bind(socket_address).await.unwrap();

    let origins = [
        // frontend location
        "http://localhost:3000".parse().unwrap(),
        "http://localhost:8000".parse().unwrap(),
    ];

    let app_state = create(&config).await;

    let cors = CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
            Method::HEAD,
        ])
        .allow_headers(Any)
        .allow_origin(origins);

    let app = Router::new()
        .nest("/api", api::controller::get_router(&app_state))
        .merge(SwaggerUi::new("/api/docs").url("/api/docs/openapi.json", ApiDocs::openapi()))
        .layer(cors);

    axum::serve(listener, app.into_make_service())
        .await
        .unwrap()
}
