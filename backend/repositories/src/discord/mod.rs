use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordConfig {
    pub client_id: String,
    pub client_secret: String,
    pub bot_token: String,
    pub guild_id: u64,
}

impl DiscordConfig {
    pub fn from_file(path: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let content = fs::read_to_string(path)?;
        let config: toml::Value = toml::from_str(&content)?;
        let discord_section = config
            .get("discord")
            .ok_or("Missing [discord] section in config")?;
        let discord_config: DiscordConfig = discord_section.clone().try_into()?;
        Ok(discord_config)
    }
}
