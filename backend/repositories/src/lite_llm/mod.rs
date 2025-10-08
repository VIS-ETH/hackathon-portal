use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{RepositoryError, RepositoryResult};

#[derive(Debug, Deserialize)]
struct NewTeamRequest {
    team_id: String,
}

#[derive(Debug, Deserialize)]
struct NewKeyRequest {
    key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiteLLMConfig {
    pub host: String,
}

#[derive(Debug, Clone)]
pub struct LiteLLMRepository {
    pub host: String,
    pub client: Client,
}

impl LiteLLMRepository {
    #[must_use]
    pub fn new(config: &LiteLLMConfig) -> Self {
        Self {
            host: config.host.clone(),
            client: Client::new(),
        }
    }

    #[must_use]
    pub fn from_config(config: &LiteLLMConfig) -> Self {
        Self::new(config)
    }

    async fn request(
        &self,
        endpoint: &str,
        payload: serde_json::Value,
        key: &str,
    ) -> RepositoryResult<serde_json::Value> {
        let res = self
            .client
            .post(format!("https://{}{}", self.host, endpoint))
            .header("Authorization", format!("Bearer {}", key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;
        let json = res.json::<serde_json::Value>().await?;
        Ok(json)
    }

    pub async fn generate_team_key(
        &self,
        team_index: i32,
        budget: f64,
        key: &str,
    ) -> RepositoryResult<String> {
        let create_team_body = json!({
            "team_alias": format!("team-{:02}", team_index),
            "max_budget": budget,
            "models": ["openai/*"],
        });

        let res = self.request("/team/new", create_team_body, key).await?;

        let team = serde_json::from_value::<NewTeamRequest>(res).map_err(|_| {
            RepositoryError::Parsing {
                message: "Failed to parse LiteLLM response (team creation)".to_string(),
            }
        })?;

        let create_key_body = json!({
            "team_id": team.team_id,
        });

        let res = self.request("/key/generate", create_key_body, key).await?;

        let key =
            serde_json::from_value::<NewKeyRequest>(res).map_err(|_| RepositoryError::Parsing {
                message: "Failed to parse LiteLLM response (key generation)".to_string(),
            })?;

        Ok(key.key)
    }
}
