use crate::auth::utils::{extract_header, normalize_ethz_auth_id};
use crate::auth::AuthenticationResult;
use crate::ApiResult;
use axum::body::Body;
use axum::extract::Request;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
#[allow(clippy::struct_field_names)]
pub struct HeaderConfig {
    // unique and sufficiently stable user identifier, e.g. a verified email
    pub auth_id_header: String,
    // currently only used for normalizing ETHZ email addresses
    pub username_header: String,
    pub name_header: String,
}

#[derive(Clone)]
pub struct HeaderAuthenticator {
    config: HeaderConfig,
}

impl HeaderAuthenticator {
    pub fn new(config: &HeaderConfig) -> Self {
        Self {
            config: config.clone(),
        }
    }

    #[allow(clippy::unnecessary_wraps)]
    pub fn validate(&self, req: &Request<Body>) -> ApiResult<Option<AuthenticationResult>> {
        let headers = req.headers();

        let auth_id = extract_header(headers, &self.config.auth_id_header);
        let username = extract_header(headers, &self.config.username_header);
        let name = extract_header(headers, &self.config.name_header);

        if let (Some(auth_id), Some(username), Some(name)) = (auth_id, username, name) {
            let normalized_auth_id = normalize_ethz_auth_id(&auth_id, &username);
            Ok(Some(AuthenticationResult {
                auth_id: normalized_auth_id,
                name,
            }))
        } else {
            Ok(None)
        }
    }
}
