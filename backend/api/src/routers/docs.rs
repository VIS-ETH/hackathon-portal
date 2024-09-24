use axum::Router;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use utoipauto::utoipauto;

#[utoipauto(paths = "api/src")]
#[derive(OpenApi)]
#[openapi(
    servers(
        (url = "http://localhost:8000", description = "Dev server"),
        (url = "https://hack.ethz.ch", description = "Prod server"),
    ),
    tags(
        (name = "Hackathon Portal", description = "Swagger for the Hackathon Dashboard by VIScon HackTech"),
    ),
)]
struct Docs;

pub fn get_swagger() -> SwaggerUi {
    SwaggerUi::new("/api/docs").url("/api/docs/openapi.json", Docs::openapi())
}
