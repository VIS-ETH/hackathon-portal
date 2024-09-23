mod events;

use crate::api_state::ApiState;
use crate::Result;
use axum::extract::Request;
use axum::http::{Method, StatusCode};
use axum::response::IntoResponse;
use axum::{Extension, Router};
use services::event::EventService;
use tower_http::cors::{Any, CorsLayer};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

async fn handler_404(request: Request) -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        format!("Not Found: {}", request.uri().path()),
    )
}

pub fn get_router(state: &ApiState) -> Router {
    Router::new().nest("/events", events::get_router(state))
}

pub async fn get_api_router(api_state: ApiState) -> Result<Router> {
    let origins = ["http://localhost:3000".parse()?];

    let cors = CorsLayer::new()
        .allow_methods([
            Method::OPTIONS,
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::HEAD,
            Method::TRACE,
            Method::CONNECT,
            Method::PATCH,
        ])
        .allow_headers(Any)
        .allow_origin(origins)
        .allow_credentials(false);

    let router = get_router(&api_state);
    // let docs_router = SwaggerUi::new("/api/docs").url("/api/docs/openapi.json", Docs::openapi());

    let event_service = EventService;

    let api_router = Router::new()
        .nest("/api", router)
        // .merge(docs_router)
        .fallback(handler_404)
        .layer(Extension(event_service))
        .layer(cors);

    Ok(api_router)
}
