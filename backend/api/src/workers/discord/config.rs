use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt::{Display, Formatter};
use strum::Display;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordConfig {
    pub default_permissions: HashMap<String, bool>,
    pub roles: Vec<RoleConfig>,
    pub categories: Vec<CategoryConfig>,
    pub channels: Vec<ChannelConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleConfig {
    pub name: String,
    pub slug: String,
    pub special: Option<SpecialRole>,
    pub color: String,
    #[serde(default = "default_true")]
    pub show_in_roster: bool,
    #[serde(default = "default_true")]
    pub mentionable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Display, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum SpecialRole {
    Admin,
    Mentor,
    Stakeholder,
    SidequestMaster,
    Participant,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryConfig {
    pub slug: String,
    pub name: String,
    #[serde(default)]
    pub special: Option<String>,
    #[serde(default = "default_visible_to")]
    pub visible_to: PermissionTarget,
    #[serde(default = "default_writable_by")]
    pub writable_by: PermissionTarget,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelConfig {
    pub name: String,
    pub category: String,
    #[serde(default = "default_visible_to")]
    pub visible_to: PermissionTarget,
    #[serde(default = "default_writable_by")]
    pub writable_by: PermissionTarget,
    #[serde(default = "default_notification")]
    pub default_notification: NotificationSetting,
    #[serde(default)]
    pub voice: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum PermissionTarget {
    Single(Option<PermissionRole>),
    Multiple(Vec<PermissionRole>),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum PermissionRole {
    Admin,
    Mentor,
    Stakeholder,
    SidequestMaster,
    All,
    Team(i32),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationSetting {
    All,
    Mentions,
    None,
}

// Default value helpers
fn default_true() -> bool {
    true
}

fn default_visible_to() -> PermissionTarget {
    PermissionTarget::Single(Some(PermissionRole::All))
}

fn default_writable_by() -> PermissionTarget {
    PermissionTarget::Single(Some(PermissionRole::Admin))
}

fn default_notification() -> NotificationSetting {
    NotificationSetting::None
}

// Implement default trait for PermissionTarget to handle null values
impl Default for PermissionTarget {
    fn default() -> Self {
        PermissionTarget::Single(None)
    }
}

// Implement conversion traits for easier usage
impl From<PermissionRole> for PermissionTarget {
    fn from(role: PermissionRole) -> Self {
        PermissionTarget::Single(Some(role))
    }
}

impl From<Vec<PermissionRole>> for PermissionTarget {
    fn from(roles: Vec<PermissionRole>) -> Self {
        PermissionTarget::Multiple(roles)
    }
}

impl From<Option<PermissionRole>> for PermissionTarget {
    fn from(role: Option<PermissionRole>) -> Self {
        PermissionTarget::Single(role)
    }
}

impl PermissionTarget {
    pub fn get_roles(&self) -> Vec<&PermissionRole> {
        match self {
            PermissionTarget::Single(Some(role)) => vec![role],
            PermissionTarget::Multiple(roles) => roles.iter().collect(),
            PermissionTarget::Single(None) => vec![],
        }
    }

    /*pub fn contains(&self, target_role: &PermissionRole) -> bool {
        match self {
            PermissionTarget::Single(Some(role)) => role == target_role,
            PermissionTarget::Multiple(roles) => roles.contains(target_role),
            PermissionTarget::Single(None) => false,
        }
    }

    pub fn is_empty(&self) -> bool {
        match self {
            PermissionTarget::Single(None) => true,
            PermissionTarget::Multiple(roles) => roles.is_empty(),
            PermissionTarget::Single(Some(_)) => false,
        }
    }*/
}

impl Display for PermissionRole {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            PermissionRole::Admin => write!(f, "Admin"),
            PermissionRole::Mentor => write!(f, "Mentor"),
            PermissionRole::Stakeholder => write!(f, "Stakeholder"),
            PermissionRole::SidequestMaster => write!(f, "SidequestMaster"),
            PermissionRole::All => write!(f, "All"),
            PermissionRole::Team(idx) => write!(f, "team-{idx:02}"),
        }
    }
}

impl CategoryConfig {
    pub fn get_visible_to_roles(&self) -> Vec<&PermissionRole> {
        self.visible_to.get_roles()
    }

    pub fn get_writable_by_roles(&self) -> Vec<&PermissionRole> {
        self.writable_by.get_roles()
    }
}

impl ChannelConfig {
    pub fn get_visible_to_roles(&self) -> Vec<&PermissionRole> {
        self.visible_to.get_roles()
    }

    pub fn get_writable_by_roles(&self) -> Vec<&PermissionRole> {
        self.writable_by.get_roles()
    }

    pub fn get_channel_type(&self) -> serenity::all::ChannelType {
        if self.voice {
            serenity::all::ChannelType::Voice
        } else {
            serenity::all::ChannelType::Text
        }
    }
}
