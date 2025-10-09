use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DiscordConfig {
    pub client_id: String,
    pub client_secret: String,
    pub bot_token: String,
}
