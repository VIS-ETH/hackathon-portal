use axum::http::StatusCode;
use utoipa::openapi::RefOr;
use utoipa::{Modify, OpenApi};
use utoipauto::utoipauto;

#[utoipauto(
    paths = "api/src/error.rs, api/src/models.rs, api/src/routers, services/src from hackathon_portal_services, repositories/src from hackathon_portal_repositories"
)]
#[derive(OpenApi)]
#[openapi(
    tags(
        (name = "Hackathon Portal", description = "Swagger for the Hackathon Portal Backend by VIScon HackTech"),
    ),
    modifiers(&DocsDefaults),
)]
pub struct Docs;

/// Fills in what the `#[utoipa::path]` macros leave out, so they can stay short.
pub struct DocsDefaults;

impl Modify for DocsDefaults {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        for item in openapi.paths.paths.values_mut() {
            let operations = [
                &mut item.get,
                &mut item.put,
                &mut item.post,
                &mut item.delete,
                &mut item.options,
                &mut item.head,
                &mut item.patch,
                &mut item.trace,
            ];

            for operation in operations.into_iter().flatten() {
                // group by `events` instead of `crate::routers::events`
                for tag in operation.tags.iter_mut().flatten() {
                    if let Some((_, short)) = tag.split_once("routers::") {
                        *tag = short.to_string();
                    }
                }

                // OpenAPI requires a description on every response
                for (status, response) in &mut operation.responses.responses {
                    let RefOr::T(response) = response else {
                        continue;
                    };
                    if response.description.is_empty() {
                        response.description = StatusCode::from_bytes(status.as_bytes())
                            .ok()
                            .and_then(|status| status.canonical_reason())
                            .unwrap_or(status)
                            .to_string();
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The frontend generates its API client from a committed copy of this spec.
    #[test]
    fn openapi_schema_matches_frontend_copy() {
        const UPDATE_HINT: &str =
            "run `UPDATE_OPENAPI_SCHEMA=1 cargo test -p hackathon-portal-api openapi` \
             and then `npm run api` in frontend/";

        let spec = Docs::openapi();

        if std::env::var_os("UPDATE_OPENAPI_SCHEMA").is_some() {
            let path = concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/../../frontend/src/api/schema.json"
            );
            // compact on purpose: prettier (`npm run api`) only collapses objects
            // that do not already span multiple lines
            let json = spec.to_json().expect("spec serializes");
            std::fs::write(path, json + "\n").expect("schema.json is writable");
            return;
        }

        let committed: serde_json::Value =
            serde_json::from_str(include_str!("../../../../frontend/src/api/schema.json"))
                .expect("schema.json is valid JSON");
        let current = serde_json::to_value(&spec).expect("spec serializes");

        assert!(
            committed == current,
            "frontend/src/api/schema.json is out of date: {UPDATE_HINT}"
        );
    }
}
