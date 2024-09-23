mod docs;
mod config;

use std::net::SocketAddr;
use axum::{routing::get, Json};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use crate::docs::ApiDocs;
use tower_http::cors::{Any, CorsLayer};
use http::Method;
use crate::config::BackendConfig;

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

    let cors = CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers(Any)
        .allow_origin(origins);

    let app = axum::Router::new()
        .merge(SwaggerUi::new("/api/docs").url("/api/docs/openapi.json", ApiDocs::openapi()))
        .layer(cors);


    axum::serve(listener, app.into_make_service())
        .await
        .unwrap()
}