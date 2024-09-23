use utoipa::OpenApi;
use utoipauto::utoipauto;

#[utoipauto(paths = "src/api/controller")]
#[derive(OpenApi)]
#[openapi(
    tags(
        (name = "Hackathon Dashboard", description = "Swagger for the Hackathon Dashboard"),
    ),
)]
pub struct ApiDocs;
