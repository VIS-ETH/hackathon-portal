use utoipa::OpenApi;
use utoipauto::utoipauto;

#[utoipauto(
    paths = "api/src/error.rs, api/src/management_routers, services/src from hackathon_portal_services, repositories/src from hackathon_portal_repositories"
)]
#[derive(OpenApi)]
#[openapi(
    tags(
        (name = "Hackathon Portal", description = "Swagger for the Hackathon Portal Backend by VIScon HackTech"),
    ),
)]
pub struct Docs;
