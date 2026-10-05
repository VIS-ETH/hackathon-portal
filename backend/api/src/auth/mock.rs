use crate::auth::AuthenticationResult;
use crate::ApiResult;
use axum::body::Body;
use axum::extract::Request;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MockConfig;

#[derive(Clone)]
pub struct MockAuthenticator;

impl MockAuthenticator {
    pub fn new(_: &MockConfig) -> Self {
        Self
    }

    #[expect(
        clippy::unused_self,
        clippy::unnecessary_wraps,
        reason = "signature shared with the other authenticators dispatched by Authenticator::validate"
    )]
    pub fn validate(&self, _: &Request<Body>) -> ApiResult<Option<AuthenticationResult>> {
        Ok(Some(AuthenticationResult {
            auth_id: "aeinstein@ethz.ch".to_string(),
            name: "Albert Einstein".to_string(),
        }))
    }
}
