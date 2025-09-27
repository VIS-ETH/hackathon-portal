use crate::auth::utils::{extract_header, normalize_ethz_auth_id};
use crate::auth::AuthenticationResult;
use crate::{ApiError, ApiResult};
use axum::body::Body;
use axum::extract::Request;
use jsonwebtoken::jwk::JwkSet;
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct JwtConfig {
    pub issuer: String,
    pub token_header: String,
    pub token_prefix: Option<String>,
}

#[derive(Clone)]
pub struct JwtAuthenticator {
    config: JwtConfig,
    jwks: JwkSet,
    validation: Validation,
}

impl JwtAuthenticator {
    pub async fn new(config: &JwtConfig) -> ApiResult<Self> {
        #[derive(Debug, Clone, Serialize, Deserialize)]
        pub struct WellKnownConfig {
            pub jwks_uri: String,
        }

        let well_known_url = format!("{}/.well-known/openid-configuration", config.issuer);

        let well_known_config = reqwest::get(&well_known_url)
            .await?
            .json::<WellKnownConfig>()
            .await?;

        let jwks = reqwest::get(&well_known_config.jwks_uri)
            .await?
            .json::<JwkSet>()
            .await?;

        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_issuer(&[&config.issuer]);
        validation.algorithms = vec![
            Algorithm::RS256,
            Algorithm::RS384,
            Algorithm::RS512,
            Algorithm::PS256,
            Algorithm::PS384,
            Algorithm::PS512,
        ];

        Ok(Self {
            config: config.clone(),
            jwks,
            validation,
        })
    }

    pub fn validate(&self, req: &Request<Body>) -> ApiResult<Option<AuthenticationResult>> {
        #[derive(Debug, Clone, Serialize, Deserialize)]
        pub struct Claims {
            pub email: String,
            pub preferred_username: String,
            pub name: String,
        }

        let headers = req.headers();

        let Some(raw_token) = extract_header(headers, &self.config.token_header) else {
            return Ok(None);
        };

        let raw_token = if let Some(prefix) = &self.config.token_prefix {
            raw_token.trim_start_matches(prefix).trim()
        } else {
            &raw_token
        };

        let token_header = decode_header(raw_token)?;

        let kid = token_header
            .kid
            .ok_or_else(|| ApiError::AuthenticationFailed {
                reason: "No kid found in token header".to_string(),
            })?;

        let jwk = self
            .jwks
            .find(&kid)
            .ok_or_else(|| ApiError::AuthenticationFailed {
                reason: format!("No matching JWK found for kid: {kid}"),
            })?;

        let decoding_key = DecodingKey::from_jwk(jwk)?;

        let token = decode::<Claims>(raw_token, &decoding_key, &self.validation)?;

        let auth_id = &token.claims.email;
        let username = &token.claims.preferred_username;
        let name = &token.claims.name;

        let normalized_auth_id = normalize_ethz_auth_id(auth_id, username);

        Ok(Some(AuthenticationResult {
            auth_id: normalized_auth_id,
            name: name.clone(),
        }))
    }
}
