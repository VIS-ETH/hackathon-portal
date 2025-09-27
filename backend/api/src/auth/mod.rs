mod header;
mod jwt;
mod mock;
mod utils;

use crate::auth::header::{HeaderAuthenticator, HeaderConfig};
use crate::auth::jwt::{JwtAuthenticator, JwtConfig};
use crate::auth::mock::{MockAuthenticator, MockConfig};
use crate::ApiResult;
use axum::body::Body;
use axum::extract::Request;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "strategy", deny_unknown_fields)]
pub enum AuthConfig {
    Mock(MockConfig),
    Header(HeaderConfig),
    Jwt(JwtConfig),
}

pub struct AuthenticationResult {
    pub auth_id: String,
    pub name: String,
}

#[derive(Clone)]
pub enum Authenticator {
    Mock(MockAuthenticator),
    Header(HeaderAuthenticator),
    Jwt(JwtAuthenticator),
}

impl Authenticator {
    pub async fn new(config: &AuthConfig) -> ApiResult<Self> {
        let authenticator = match config {
            AuthConfig::Mock(c) => Authenticator::Mock(MockAuthenticator::new(c)),
            AuthConfig::Header(c) => Authenticator::Header(HeaderAuthenticator::new(c)),
            AuthConfig::Jwt(c) => Authenticator::Jwt(JwtAuthenticator::new(c).await?),
        };

        Ok(authenticator)
    }

    /// Validates the incoming request using the configured authentication strategy.
    ///
    /// # Returns
    /// - `Ok(Some(AuthenticationResult))` if the request contains valid credentials.
    /// - `Ok(None)` if the request does not contain any credentials (anonymous user).
    /// - `Err(ApiError)` if credentials are provided but are invalid, or an internal error occurs.
    pub fn validate(&self, req: &Request<Body>) -> ApiResult<Option<AuthenticationResult>> {
        match self {
            Authenticator::Mock(v) => v.validate(req),
            Authenticator::Header(v) => v.validate(req),
            Authenticator::Jwt(v) => v.validate(req),
        }
    }
}
