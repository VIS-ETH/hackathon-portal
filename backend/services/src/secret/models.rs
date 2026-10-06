use hackathon_portal_repositories::db::{EventRole, SecretScope};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use utoipa::ToSchema;
use uuid::Uuid;

/// Name of the team secret that holds the generated `LiteLLM` key.
pub const AI_API_KEY_SECRET_NAME: &str = "AI API Key";

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Secret {
    pub id: Uuid,
    pub event_id: Uuid,
    pub scope: SecretScope,
    pub name: String,
    /// Values keyed by the id of the team or user, depending on the scope.
    pub values: HashMap<Uuid, String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SecretForCreate {
    pub event_id: Uuid,
    pub scope: SecretScope,
    pub name: String,
}

/// A team or user that secret values can be distributed to.
#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SecretSubject {
    pub id: Uuid,
    /// Identifies the subject in imports: `team-NN` for teams, the auth id for users.
    pub key: String,
    /// The index of a team, `None` for users.
    pub index: Option<i32>,
    pub label: String,
    /// The event roles of a user, empty for teams.
    pub roles: Vec<EventRole>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct EventSecrets {
    pub secrets: Vec<Secret>,
    pub teams: Vec<SecretSubject>,
    pub users: Vec<SecretSubject>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct SecretValue {
    pub name: String,
    pub value: String,
}
