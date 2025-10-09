use crate::workers::discord::config::CategoryConfig;
use crate::workers::discord::config::ChannelConfig;
use crate::workers::discord::config::DiscordConfig;
use crate::workers::discord::config::NotificationSetting;
use crate::workers::discord::config::PermissionRole;
use crate::workers::discord::config::PermissionTarget;
use crate::workers::discord::config::RoleConfig;
use crate::workers::discord::config::SpecialRole;
use crate::ApiState;
use hackathon_portal_services::event::models::Event;
use serenity::all::ChannelId;
use serenity::all::ChannelType;
use serenity::all::CreateChannel;
use serenity::all::EditChannel;
use serenity::all::PermissionOverwrite;
use serenity::all::PermissionOverwriteType;
use serenity::async_trait;
use serenity::builder::EditRole;
use serenity::client::{Client, Context, EventHandler};
use serenity::model::gateway::Ready;
use serenity::model::guild::Role;
use serenity::model::id::RoleId;
use serenity::model::permissions::Permissions;
use serenity::prelude::GatewayIntents;
use std::collections::{HashMap, HashSet};
use std::string::ToString;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

pub struct DiscordClient {
    client: Client,
}

impl DiscordClient {
    pub async fn new(
        api_state: &ApiState,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let token = api_state.discord_config.bot_token.clone();

        let intents = GatewayIntents::GUILDS;

        let client = Client::builder(&token, intents)
            .event_handler(Handler)
            .await?;

        Ok(Self { client })
    }

    pub async fn start(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        // This starts the connection and will run the ready event handler
        if let Err(why) = self.client.start().await {
            Err(Box::new(why))
        } else {
            Ok(())
        }
    }

    pub async fn check_guild_membership(
        &self,
        guild_id: String,
    ) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
        let cache = &self.client.cache;
        let guild_id: u64 = guild_id.parse()?;

        if cache.guild(guild_id).is_some() {
            Ok(true)
        } else {
            // Fallback to HTTP API
            let http = &self.client.http;
            match http.get_guild(guild_id.into()).await {
                Ok(_) => Ok(true),
                Err(_) => Ok(false),
            }
        }
    }

    pub async fn sync_configuration(
        &self,
        api_state: &ApiState,
        event: &Event,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!(
            "Syncing configuration for event: {} (ID: {})",
            event.name, event.id
        );

        // Remember guildid
        let guild_id: u64 = if let Some(id) = &event.discord_server_id {
            id.parse()?
        } else {
            info!("No Discord server ID for event, skipping sync");
            return Ok(());
        };

        // Parse the YAML configuration
        let mut discord_config = if let Some(config_yaml) = &event.discord_config {
            self.parse_discord_config(config_yaml)?
        } else {
            info!("No Discord configuration found for event, skipping sync");
            return Ok(());
        };

        // Log the parsed configuration details
        info!(
            "Parsed Discord configuration with {} roles, {} categories, and {} channels",
            discord_config.roles.len(),
            discord_config.categories.len(),
            discord_config.channels.len()
        );

        // Sync @everyone permissions (default_permissions)
        self.set_everyone_permissions(guild_id, &discord_config.default_permissions)
            .await?;

        // Create, update, or delete roles based on the configuration
        self.sync_roles(api_state, event.id, &mut discord_config, guild_id)
            .await?;

        // Assign users to the roles
        let role_mapping = self
            .sync_user_roles(api_state, &discord_config, guild_id, event.id)
            .await?;

        // Make role mapping empty for now
        let synced_categories = self
            .sync_categories(guild_id, &discord_config.categories, &role_mapping)
            .await?;

        // Sync channels
        self.sync_channels(
            api_state,
            guild_id,
            event.id,
            &mut discord_config.channels,
            &role_mapping,
            &synced_categories,
        )
        .await?;

        Ok(())
    }

    pub async fn sync_channels(
        &self,
        api_state: &ApiState,
        guild_id: u64,
        event_id: Uuid,
        channels: &mut Vec<ChannelConfig>,
        role_mapping: &HashMap<String, RoleId>,
        category_mapping: &HashMap<String, ChannelId>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Syncing channels for guild: {}", guild_id);

        // Get existing channels in the guild
        let existing_channels = self.client.http.get_channels(guild_id.into()).await?;
        let mut existing_channel_map: HashMap<String, ChannelId> = existing_channels
            .into_iter()
            .filter(|channel| channel.kind != serenity::all::ChannelType::Category)
            .map(|channel| (channel.name.clone(), channel.id))
            .collect();

        let mut channels_to_keep = HashSet::new();
        let mut team_channels_by_index = HashMap::new();

        let mut renamed_team_channels_map = HashMap::new();
        let mut renamed_team_channels = Vec::new();

        // Add team channels
        let teams = api_state.team_service.get_teams(event_id).await?;
        for team in teams {
            let team_channel_name = format!("{:02}-{}", team.index, team.name);
            let slug_name = team_channel_name.to_lowercase().replace(' ', "-");
            team_channels_by_index.insert(team.index, slug_name.clone());

            channels.push(ChannelConfig {
                name: slug_name,
                category: "teams".to_string(),
                voice: false,
                visible_to: PermissionTarget::Multiple(vec![
                    PermissionRole::Admin,
                    PermissionRole::Team(team.index),
                ]),
                writable_by: PermissionTarget::Multiple(vec![
                    PermissionRole::Admin,
                    PermissionRole::Team(team.index),
                ]),
                default_notification: NotificationSetting::All,
            });
        }

        // Fix other channel names to slug format
        for channel in channels.iter_mut() {
            // Remove spaces and special characters but keep emojis
            let result = channel.name.to_lowercase().replace(' ', "-");
            if channel.name != result {
                debug!("Renaming channel '{}' to slug '{}'", channel.name, result);
                channel.name = result;
            }
        }

        // First pass: Handle team channel renaming
        for (team_index, expected_channel_name) in &team_channels_by_index {
            // Look for existing team channel with same index but different name
            let existing_team_channel = existing_channel_map.iter().find(|(existing_name, _)| {
                Self::is_team_channel(existing_name)
                    && Self::get_team_index_from_channel_name(existing_name) == Some(*team_index)
                    && *existing_name != expected_channel_name
            });

            if let Some((old_name, channel_id)) = existing_team_channel {
                info!(
                    "Renaming team channel from '{}' to '{}'",
                    old_name, expected_channel_name
                );

                // Update team channel name
                self.client
                    .http
                    .edit_channel(
                        *channel_id,
                        &EditChannel::new().name(expected_channel_name),
                        Some("Discord sync: renaming team channel"),
                    )
                    .await?;

                renamed_team_channels_map.insert(expected_channel_name.clone(), *channel_id);
                renamed_team_channels.push(old_name.clone());
            }
        }

        // Update existing_channel_map with renamed channels
        for (new_name, channel_id) in &renamed_team_channels_map {
            existing_channel_map.insert(new_name.clone(), *channel_id);
        }

        // Upsert channels
        for channel_config in channels {
            channels_to_keep.insert(channel_config.name.clone());

            if let Some(existing_id) = existing_channel_map.get(&channel_config.name) {
                // Update existing channel
                debug!("Updating existing channel: {} ", channel_config.name);

                // Update permissions
                self.setup_channel_permissions(
                    guild_id,
                    *existing_id,
                    channel_config,
                    role_mapping,
                )
                .await?;

                // Move to category if needed
                let category_slug = &channel_config.category;

                if let Some(category_id) = category_mapping.get(category_slug) {
                    self.client
                        .http
                        .edit_channel(
                            *existing_id,
                            &EditChannel::new().category(*category_id),
                            Some("Discord sync: moving channel to category"),
                        )
                        .await?;
                } else {
                    warn!(
                        "Category slug {} not found for channel {}, cannot move",
                        category_slug, channel_config.name
                    );
                }
            } else {
                // Create new channel
                info!("Creating new channel: {}", channel_config.name);

                let mut create_channel = CreateChannel::new(&channel_config.name)
                    .kind(channel_config.get_channel_type());

                // Assign to category if specified
                if let Some(category_id) = category_mapping.get(&channel_config.category) {
                    create_channel = create_channel.category(*category_id);
                } else {
                    warn!(
                        "Category slug {} not found for channel {}, cannot assign",
                        channel_config.category, channel_config.name
                    );
                }

                let channel = self
                    .client
                    .http
                    .create_channel(
                        guild_id.into(),
                        &create_channel,
                        Some("Discord sync: creating channel"),
                    )
                    .await?;
                // Set up permissions
                self.setup_channel_permissions(guild_id, channel.id, channel_config, role_mapping)
                    .await?;
            }
        }
        // Delete channels that are no longer in config
        for (channel_name, channel_id) in existing_channel_map {
            if !channels_to_keep.contains(&channel_name)
                && !renamed_team_channels.contains(&channel_name)
            {
                info!("Deleting channel: {} (no longer in config)", channel_name);
                match self
                    .client
                    .http
                    .delete_channel(channel_id, Some("Discord Sync: Deleting chan"))
                    .await
                {
                    Ok(_) => info!("Successfully deleted channel: {}", channel_name),
                    Err(e) => warn!("Failed to delete channel {}: {}", channel_name, e),
                }
            }
        }

        info!("Channel synchronization completed");
        Ok(())
    }

    fn is_team_channel(channel_name: &str) -> bool {
        let mut chars = channel_name.chars();

        // Check if first two characters are digits
        let first_char = chars.next();
        let second_char = chars.next();
        let third_char = chars.next();

        first_char.is_some_and(|c| c.is_ascii_digit())
            && second_char.is_some_and(|c| c.is_ascii_digit())
            && (third_char == Some('-'))
    }

    fn get_team_index_from_channel_name(channel_name: &str) -> Option<i32> {
        if Self::is_team_channel(channel_name) {
            // Take the first two characters and parse them
            let index_str: String = channel_name.chars().take(2).collect();
            index_str.parse::<i32>().ok()
        } else {
            None
        }
    }

    pub async fn sync_categories(
        &self,
        guild_id: u64,
        categories: &[CategoryConfig],
        role_mapping: &HashMap<String, RoleId>,
    ) -> Result<HashMap<String, ChannelId>, Box<dyn std::error::Error + Send + Sync>> {
        info!("Syncing categories for guild: {}", guild_id);

        // Get existing categories in the guild
        let existing_channels = self.client.http.get_channels(guild_id.into()).await?;
        let existing_categories: HashMap<String, ChannelId> = existing_channels
            .into_iter()
            .filter(|channel| channel.kind == serenity::all::ChannelType::Category)
            .map(|channel| (channel.name, channel.id))
            .collect();

        let mut synced_categories = HashMap::new();
        let mut categories_to_keep = HashSet::new();

        // Upsert categories
        for category_config in categories {
            categories_to_keep.insert(category_config.name.clone());

            if let Some(existing_id) = existing_categories.get(&category_config.name) {
                // Update existing category
                debug!(
                    "Updating existing category: {} ({})",
                    category_config.name, category_config.slug
                );

                // Update permissions
                self.setup_category_permissions(
                    guild_id,
                    *existing_id,
                    category_config,
                    role_mapping,
                )
                .await?;

                synced_categories.insert(category_config.slug.clone(), *existing_id);
            } else {
                // Create new category
                info!(
                    "Creating new category: {} ({})",
                    category_config.name, category_config.slug
                );

                let category_channel = self
                    .client
                    .http
                    .create_channel(
                        guild_id.into(),
                        &CreateChannel::new(&category_config.name).kind(ChannelType::Category),
                        Some("Discord sync: creating category"),
                    )
                    .await?;

                // Set up permissions
                self.setup_category_permissions(
                    guild_id,
                    category_channel.id,
                    category_config,
                    role_mapping,
                )
                .await?;

                synced_categories.insert(category_config.slug.clone(), category_channel.id);
            }
        }

        // Delete categories that are no longer in config
        for (category_name, category_id) in existing_categories {
            if !categories_to_keep.contains(&category_name) {
                info!("Deleting category: {} (no longer in config)", category_name);
                match self
                    .client
                    .http
                    .delete_channel(category_id, Some("Discord Sync: Deleting cat"))
                    .await
                {
                    Ok(_) => info!("Successfully deleted category: {}", category_name),
                    Err(e) => warn!("Failed to delete category {}: {}", category_name, e),
                }
            }
        }

        info!("Category synchronization completed");
        Ok(synced_categories)
    }

    async fn setup_category_permissions(
        &self,
        guild_id: u64,
        category_id: ChannelId,
        category_config: &CategoryConfig,
        role_mapping: &HashMap<String, RoleId>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.setup_permissions(
            guild_id,
            category_id,
            &category_config.name,
            &category_config.get_visible_to_roles(),
            &category_config.get_writable_by_roles(),
            role_mapping,
        )
        .await
    }

    async fn setup_channel_permissions(
        &self,
        guild_id: u64,
        channel_id: ChannelId,
        channel_config: &ChannelConfig,
        role_mapping: &HashMap<String, RoleId>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.setup_permissions(
            guild_id,
            channel_id,
            &channel_config.name,
            &channel_config.get_visible_to_roles(),
            &channel_config.get_writable_by_roles(),
            role_mapping,
        )
        .await
    }

    async fn setup_permissions(
        &self,
        guild_id: u64,
        channel_id: ChannelId,
        verbose_name: &str,
        visible_to_roles: &[&PermissionRole],
        writable_by_roles: &[&PermissionRole],
        role_mapping: &HashMap<String, RoleId>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        // First, get current permission overwrites to avoid unnecessary API calls
        let channel = match self.client.http.get_channel(channel_id).await? {
            serenity::all::Channel::Guild(channel) => channel,
            _ => return Err("Category channel is not a guild channel".into()),
        };

        let _current_overwrites = channel.permissions.clone();

        // Build desired permission overwrites
        let mut desired_overwrites = Vec::new();

        // Handle @everyone role first (base permissions)
        let everyone_role_id = RoleId::from(guild_id);

        // Default: deny view channel for everyone
        let mut everyone_allow = Permissions::empty();
        let mut everyone_deny = Permissions::VIEW_CHANNEL;

        // Log visible_to_roles and writable_by_roles for debugging
        debug!(
            "Cat/Chan {} visible_to roles: {:?}",
            verbose_name, visible_to_roles
        );
        debug!(
            "Cat/Chan {} writable_by roles: {:?}",
            verbose_name, writable_by_roles
        );

        if visible_to_roles.contains(&&PermissionRole::All) {
            everyone_allow |= Permissions::VIEW_CHANNEL;
            everyone_deny &= !Permissions::VIEW_CHANNEL;
        }

        if writable_by_roles.contains(&&PermissionRole::All) {
            everyone_allow |= Permissions::SEND_MESSAGES;
        }

        desired_overwrites.push(PermissionOverwrite {
            allow: everyone_allow,
            deny: everyone_deny,
            kind: PermissionOverwriteType::Role(everyone_role_id),
        });

        // Handle specific roles for visible_to
        for role_name in visible_to_roles {
            if role_name != &&PermissionRole::All {
                if let Some(role_id) = role_mapping.get(&(role_name.to_string())) {
                    debug!(
                        "Adding VIEW_CHANNEL permission for role {} on cat/chan {}",
                        role_name, verbose_name
                    );
                    desired_overwrites.push(PermissionOverwrite {
                        allow: Permissions::VIEW_CHANNEL,
                        deny: Permissions::empty(),
                        kind: PermissionOverwriteType::Role(*role_id),
                    });
                } else {
                    warn!("Role {} not found in role mapping, cannot set VIEW_CHANNEL permission for cat/chan {}", role_name, verbose_name);
                }
            }
        }

        // Log role_mapping for debugging
        debug!("Role mapping: {:?}", role_mapping);

        // Handle specific roles for writable_by
        for role_name in writable_by_roles {
            if role_name != &&PermissionRole::All {
                debug!(
                    "Adding SEND_MESSAGES permission for role {} on cat/chan {}",
                    role_name, verbose_name
                );

                if let Some(role_id) = role_mapping.get(&(role_name.to_string())) {
                    // Check if we already have an overwrite for this role
                    if let Some(existing_idx) = desired_overwrites.iter().position(|ow| {
                        if let PermissionOverwriteType::Role(rid) = ow.kind {
                            rid == *role_id
                        } else {
                            false
                        }
                    }) {
                        // Update existing overwrite
                        desired_overwrites[existing_idx].allow |= Permissions::SEND_MESSAGES;
                    } else {
                        // Create new overwrite
                        desired_overwrites.push(PermissionOverwrite {
                            allow: Permissions::SEND_MESSAGES | Permissions::VIEW_CHANNEL,
                            deny: Permissions::empty(),
                            kind: PermissionOverwriteType::Role(*role_id),
                        });
                    }
                } else {
                    warn!("Role {} not found in role mapping, cannot set SEND_MESSAGES permission for cat/chan {}", role_name, verbose_name);
                }
            }
        }

        // Log desired overwrites for debugging
        debug!(
            "Desired permission overwrites for cat/chan {}: {:?}",
            verbose_name, desired_overwrites
        );

        // Apply permission changes only if they're different from current
        // Room for improvement: Compare current_overwrites and desired_overwrites to avoid unnecessary API calls
        self.client
            .http
            .edit_channel(
                channel_id,
                &EditChannel::new().permissions(desired_overwrites.clone()),
                Some("Discord sync: updating cat/channel permissions"),
            )
            .await?;

        Ok(())
    }

    async fn sync_user_roles(
        &self,
        api_state: &ApiState,
        config: &DiscordConfig,
        guild_id: u64,
        event_id: Uuid,
    ) -> Result<HashMap<String, RoleId>, Box<dyn std::error::Error + Send + Sync>> {
        info!("Syncing role assignment for event: {}", event_id);
        info!("This may take a while depending on the number of users...");

        // 1. Get current roles from Discord server
        let current_roles = self.client.http.get_guild_roles(guild_id.into()).await?;

        // 2. Get users and their assigned roles from database
        let user_roles = self
            .get_user_roles_from_database(api_state, event_id)
            .await?;

        // 3. Create a mapping from config role "special" property to config role name for quick lookup
        // That means, look in config.roles for example "admin" and add it to the admin key so below i can just use "admin"
        let mut role_mapping: HashMap<String, RoleId> = config
            .roles
            .iter()
            .filter_map(|r| {
                // Only proceed if special is Some(...)
                if let Some(special) = &r.special {
                    // Find the corresponding role in current_roles to get its ID
                    current_roles
                        .iter()
                        .find(|cr| cr.name == r.name)
                        .map(|cr| (special.to_string(), cr.id))
                } else {
                    None
                }
            })
            .collect();

        // 3.1 Add team roles to mapping
        for role in &current_roles {
            if role.name.starts_with("team-") {
                role_mapping.insert(role.name.clone(), role.id);
            }
        }

        debug!("Role mapping for sync: {:?}", role_mapping);

        // 4. Sync each user's roles
        for (user_id, expected_role_names) in user_roles {
            self.sync_single_user_roles(&role_mapping, guild_id, user_id, expected_role_names)
                .await?;
        }

        info!("User role synchronization completed");
        Ok(role_mapping)
    }

    async fn get_user_roles_from_database(
        &self,
        api_state: &ApiState,
        event_id: Uuid,
    ) -> Result<HashMap<String, Vec<String>>, Box<dyn std::error::Error + Send + Sync>> {
        let event_affiliates = api_state
            .authorization_service
            .get_event_affiliates(event_id, None)
            .await?;

        // Map: discord_id -> Vec<String>
        let mut user_roles: HashMap<String, Vec<String>> = HashMap::new();

        for affiliate in event_affiliates {
            if let Ok(Some(discord_id)) = api_state
                .user_service
                .get_event_discord_id(affiliate.id, event_id)
                .await
            {
                for role in affiliate.roles {
                    // Insert or append roles per user
                    user_roles
                        .entry(discord_id.clone())
                        .or_default()
                        .push(role.to_string());
                }
            }
        }

        // Collect team memberships
        let teams = api_state.team_service.get_teams(event_id).await?;
        for team in teams {
            if team.index == 0 {
                // Skip teams without assigned index
                continue;
            }

            let team_affiliates = api_state
                .authorization_service
                .get_team_affiliates(team.id, None)
                .await?;

            for affiliate in team_affiliates {
                if let Ok(Some(discord_id)) = api_state
                    .user_service
                    .get_event_discord_id(affiliate.id, event_id)
                    .await
                {
                    // Add team role in the format "team-{index}"
                    user_roles
                        .entry(discord_id.clone())
                        .or_default()
                        .push(format!("team-{:02}", team.index));
                }
            }
        }

        // Log for debugging
        for (discord_id, roles) in &user_roles {
            let role_names: Vec<String> =
                roles.iter().map(std::string::ToString::to_string).collect();
            debug!("User {} has roles {:?}", discord_id, role_names);
        }

        Ok(user_roles)
    }

    async fn sync_single_user_roles(
        &self,
        role_mapping: &HashMap<String, RoleId>,
        guild_id: u64,
        discord_user_id: String,
        expected_role_names: Vec<String>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let discord_user_id: u64 = discord_user_id.parse().map_err(|e| {
            format!("Failed to parse discord_user_id '{discord_user_id}' to u64: {e}")
        })?;

        // Get user's current roles in the guild
        let Ok(member) = self
            .client
            .http
            .get_member(guild_id.into(), discord_user_id.into())
            .await
        else {
            warn!("User {} not found in guild, skipping", discord_user_id);
            return Ok(());
        };

        let current_role_ids: HashSet<RoleId> = member.roles.iter().copied().collect();

        // Find the expected role IDs (multiple)
        let expected_role_ids: Vec<RoleId> = expected_role_names
            .iter()
            .filter_map(|role_name| {
                if let Some(role_id) = role_mapping.get(role_name) {
                    Some(*role_id)
                } else {
                    warn!(
                        "Role '{}' not found in server for user {}",
                        role_name, discord_user_id
                    );
                    None
                }
            })
            .collect();

        // Determine which roles to add and remove
        let config_roles: HashSet<String> = role_mapping.keys().cloned().collect();

        let roles_to_add: Vec<RoleId> = expected_role_ids
            .iter()
            .filter(|expected_role_id| !current_role_ids.contains(expected_role_id))
            .copied() // converts &RoleId to RoleId
            .collect();

        // Remove other config roles that user shouldn't have
        let roles_to_remove: Vec<RoleId> = member
            .roles
            .iter()
            .filter_map(|role_id| {
                role_mapping
                    .iter()
                    .find_map(|(name, id)| if id == role_id { Some(name) } else { None })
                    .filter(|role_name| {
                        !expected_role_names.contains(role_name)
                            && config_roles.contains(*role_name)
                    })
                    .map(|_| *role_id)
            })
            .collect();

        // Apply changes
        if !roles_to_remove.is_empty() {
            info!(
                "Removing {} roles from user {}",
                roles_to_remove.len(),
                discord_user_id
            );
            for role_id in roles_to_remove {
                self.client
                    .http
                    .remove_member_role(
                        guild_id.into(),
                        discord_user_id.into(),
                        role_id,
                        Some("Sync, removing role"),
                    )
                    .await?;
            }
        }

        if !roles_to_add.is_empty() {
            info!(
                "Adding {} roles to user {}",
                roles_to_add.len(),
                discord_user_id
            );
            for role_id in roles_to_add {
                self.client
                    .http
                    .add_member_role(
                        guild_id.into(),
                        discord_user_id.into(),
                        role_id,
                        Some("Sync, adding role"),
                    )
                    .await?;
            }
        }

        Ok(())
    }

    async fn sync_roles(
        &self,
        api_state: &ApiState,
        event_id: Uuid,
        config: &mut DiscordConfig,
        guild_id: u64,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Syncing roles for guild: {}", guild_id);

        // Get current roles from the server
        let current_roles = self.client.http.get_guild_roles(guild_id.into()).await?;

        // Create sets for comparison
        let mut config_role_names: HashSet<String> =
            config.roles.iter().map(|r| r.name.to_string()).collect();

        let current_role_names: HashSet<String> =
            current_roles.iter().map(|r| r.name.to_string()).collect();

        // Get team roles from database
        let teams = api_state.team_service.get_teams(event_id).await?;

        // Add all team indexes to config roles names, in the format team-{index}
        for team in teams {
            // Only do that if indexes have been assigned
            if team.index > 0 {
                config_role_names.insert(format!("team-{:02}", team.index));
                config.roles.push(RoleConfig {
                    name: format!("team-{:02}", team.index),
                    slug: format!("team-{:02}", team.index),
                    mentionable: true,
                    show_in_roster: false,
                    color: "#acacac".to_string(),
                    special: None,
                });
            }
        }

        // Total roles in config
        let total_roles = config.roles.len();

        // Log all config roles debg
        debug!("Config roles: {:?}", config_role_names);
        debug!("Current server roles: {:?}", current_role_names);

        // 1. Create roles that are in config but not on server
        for (index, role_config) in config.roles.iter().enumerate() {
            if !current_role_names.contains(&role_config.name) {
                let position = (total_roles - index) as u16;
                info!(
                    "Creating new role: {} (position: {})",
                    role_config.name, position
                );
                self.create_role(role_config, guild_id, position).await?;
            }
        }

        // 2. Update roles that exist in both config and server
        for (index, role_config) in config.roles.iter().enumerate() {
            if let Some(existing_role) = current_roles.iter().find(|r| r.name == role_config.name) {
                let position = (total_roles - index) as u16;
                debug!("Role exists: {}", role_config.name);
                if self.role_needs_update(existing_role, role_config, position) {
                    info!(
                        "Updating role: {} (position: {})",
                        role_config.name, position
                    );
                    self.update_role(existing_role.id, role_config, guild_id, position)
                        .await?;
                }
            }
        }

        // 3. Delete roles that are on server but not in config (except special roles)
        for existing_role in &current_roles {
            // Don't delete @everyone role (has same ID as guild) or other special roles
            if existing_role.id == guild_id || existing_role.managed {
                continue;
            }

            if !config_role_names.contains(&(existing_role.name.to_string())) {
                info!("Deleting role: {} (not in config)", existing_role.name);
                self.delete_role(existing_role.id, guild_id).await?;
            }
        }

        info!("Role synchronization completed");
        Ok(())
    }

    async fn create_role(
        &self,
        role_config: &RoleConfig,
        guild_id: u64,
        position: u16,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut create_role = EditRole::default()
            .name(&role_config.name) // Use slug as the role name in Discord
            .colour(self.parse_color(&role_config.color)?)
            .mentionable(role_config.mentionable)
            .hoist(role_config.show_in_roster) // hoist means show in separate section in member list
            .position(position);

        // Set permissions based on special role type
        let permissions = self.get_role_permissions(role_config.special.as_ref());
        create_role = create_role.permissions(permissions);

        self.client
            .http
            .create_role(
                guild_id.into(),
                &create_role,
                Some("Discord sync: Creating role"),
            )
            .await?;
        Ok(())
    }

    async fn update_role(
        &self,
        role_id: RoleId,
        role_config: &RoleConfig,
        guild_id: u64,
        position: u16,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let edit_role = EditRole::new()
            .name(&role_config.name)
            .colour(self.parse_color(&role_config.color)?)
            .mentionable(role_config.mentionable)
            .hoist(role_config.show_in_roster)
            .permissions(self.get_role_permissions(role_config.special.as_ref()))
            .position(position);

        self.client
            .http
            .edit_role(
                guild_id.into(),
                role_id,
                &edit_role,
                Some("Discord sync: updating role"),
            )
            .await?;
        Ok(())
    }

    async fn delete_role(
        &self,
        role_id: RoleId,
        guild_id: u64,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.client
            .http
            .delete_role(
                guild_id.into(),
                role_id,
                Some("Discoed sync: deleting role"),
            )
            .await?;
        Ok(())
    }

    fn role_needs_update(
        &self,
        existing_role: &Role,
        role_config: &RoleConfig,
        _expected_position: u16,
    ) -> bool {
        // Check if color needs update
        let config_color = self.parse_color(&role_config.color).unwrap_or(0);
        if existing_role.colour.0 != config_color {
            return true;
        }

        // Check if name needs update
        if existing_role.name != role_config.name {
            return true;
        }

        // Check if mentionable needs update
        if existing_role.mentionable != role_config.mentionable {
            return true;
        }

        // Check if hoist (show in roster) needs update
        if existing_role.hoist != role_config.show_in_roster {
            return true;
        }

        // Check if permissions need update
        let expected_permissions = self.get_role_permissions(role_config.special.as_ref());
        if existing_role.permissions != expected_permissions {
            return true;
        }

        // Check if position needs update
        /*if existing_role.position != expected_position {
            return true;
        }*/

        false
    }

    async fn set_everyone_permissions(
        &self,
        guild_id: u64,
        default_permissions: &HashMap<String, bool>,
    ) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        info!("Setting @everyone permissions: {:?}", default_permissions);

        // Convert the permission map to Serenity Permissions
        let permissions = self.parse_permissions(default_permissions);

        // Update the @everyone role permissions
        let everyone_role_id = RoleId::new(guild_id); // @everyone role ID is same as guild ID

        self.client
            .http
            .edit_role(
                guild_id.into(),
                everyone_role_id,
                &EditRole::new().permissions(permissions),
                Some("Discord sync: updating @everyone permissions"),
            )
            .await?;

        info!("Successfully updated @everyone permissions");
        Ok(())
    }

    fn parse_discord_config(
        &self,
        config_yaml: &str,
    ) -> Result<DiscordConfig, Box<dyn std::error::Error + Send + Sync>> {
        if config_yaml.trim().is_empty() {
            return Err("Empty Discord configuration".into());
        }

        let config: DiscordConfig = serde_yaml::from_str(config_yaml).map_err(|e| {
            error!("Failed to parse Discord YAML configuration: {}", e);
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;

        Ok(config)
    }

    fn parse_permissions(&self, permission_map: &HashMap<String, bool>) -> Permissions {
        let mut permissions = Permissions::empty();

        for (permission_name, allowed) in permission_map {
            if let Some(permission) = self.map_permission_name(permission_name) {
                if *allowed {
                    permissions.insert(permission);
                } else {
                    permissions.remove(permission);
                }
            } else {
                warn!("Unknown permission name in config: {}", permission_name);
            }
        }

        // Debug print the final permissions
        debug!("Computed permissions: {:?}", permissions);

        permissions
    }

    fn parse_color(
        &self,
        color_str: &str,
    ) -> Result<u32, Box<dyn std::error::Error + Send + Sync>> {
        // Handle hex colors like "#FF0000" or "FF0000"
        let color_str = color_str.trim_start_matches('#');
        u32::from_str_radix(color_str, 16)
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)
    }

    fn get_role_permissions(&self, special_role: Option<&SpecialRole>) -> Permissions {
        match special_role {
            Some(SpecialRole::Admin) => Permissions::all(),
            Some(_) | None => Permissions::empty(), // Other roles
        }
    }

    fn map_permission_name(&self, name: &str) -> Option<Permissions> {
        match name.to_lowercase().as_str() {
            "create_instant_invite" => Some(Permissions::CREATE_INSTANT_INVITE),
            "kick_members" => Some(Permissions::KICK_MEMBERS),
            "ban_members" => Some(Permissions::BAN_MEMBERS),
            "administrator" => Some(Permissions::ADMINISTRATOR),
            "manage_channels" => Some(Permissions::MANAGE_CHANNELS),
            "manage_guild" => Some(Permissions::MANAGE_GUILD),
            "add_reactions" => Some(Permissions::ADD_REACTIONS),
            "view_audit_log" => Some(Permissions::VIEW_AUDIT_LOG),
            "priority_speaker" => Some(Permissions::PRIORITY_SPEAKER),
            "stream" => Some(Permissions::STREAM),
            "view_channel" => Some(Permissions::VIEW_CHANNEL),
            "send_messages" => Some(Permissions::SEND_MESSAGES),
            "send_tts_messages" => Some(Permissions::SEND_TTS_MESSAGES),
            "manage_messages" => Some(Permissions::MANAGE_MESSAGES),
            "embed_links" => Some(Permissions::EMBED_LINKS),
            "attach_files" => Some(Permissions::ATTACH_FILES),
            "read_message_history" => Some(Permissions::READ_MESSAGE_HISTORY),
            "mention_everyone" => Some(Permissions::MENTION_EVERYONE),
            "use_external_emojis" => Some(Permissions::USE_EXTERNAL_EMOJIS),
            "view_guild_insights" => Some(Permissions::VIEW_GUILD_INSIGHTS),
            "connect" => Some(Permissions::CONNECT),
            "speak" => Some(Permissions::SPEAK),
            "mute_members" => Some(Permissions::MUTE_MEMBERS),
            "deafen_members" => Some(Permissions::DEAFEN_MEMBERS),
            "move_members" => Some(Permissions::MOVE_MEMBERS),
            "use_vad" => Some(Permissions::USE_VAD),
            "change_nickname" => Some(Permissions::CHANGE_NICKNAME),
            "manage_nicknames" => Some(Permissions::MANAGE_NICKNAMES),
            "manage_roles" => Some(Permissions::MANAGE_ROLES),
            "manage_webhooks" => Some(Permissions::MANAGE_WEBHOOKS),
            "create_guild_expressions" => Some(Permissions::CREATE_GUILD_EXPRESSIONS),
            "use_application_commands" => Some(Permissions::USE_APPLICATION_COMMANDS),
            "request_to_speak" => Some(Permissions::REQUEST_TO_SPEAK),
            "manage_events" => Some(Permissions::MANAGE_EVENTS),
            "manage_threads" => Some(Permissions::MANAGE_THREADS),
            "create_public_threads" => Some(Permissions::CREATE_PUBLIC_THREADS),
            "create_private_threads" => Some(Permissions::CREATE_PRIVATE_THREADS),
            "use_external_stickers" => Some(Permissions::USE_EXTERNAL_STICKERS),
            "send_messages_in_threads" => Some(Permissions::SEND_MESSAGES_IN_THREADS),
            "use_embedded_activities" => Some(Permissions::USE_EMBEDDED_ACTIVITIES),
            "moderate_members" => Some(Permissions::MODERATE_MEMBERS),
            "send_polls" => Some(Permissions::SEND_POLLS),
            _ => None,
        }
    }
}

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn ready(&self, _ctx: Context, _ready: Ready) {}
}
