use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use utoipauto::utoipauto;

#[utoipauto(
    paths = "api/src, services/src from hackathon_portal_services, repositories/src from hackathon_portal_repositories"
)]
#[derive(OpenApi)]
#[openapi(
    servers(
        (url = "http://localhost:8080", description = "Dev server"),
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
