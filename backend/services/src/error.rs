use crate::authorization::groups::Group;
use chrono::NaiveDateTime;
use derive_more::From;
use hackathon_portal_repositories::db::{EventPhase, MediaUsage};
use hackathon_portal_repositories::RepositoryError;
use serde::Serialize;
use serde_with::{serde_as, DisplayFromStr};
use std::fmt;
use uuid::Uuid;

pub type ServiceResult<T> = Result<T, ServiceError>;

#[serde_as]
#[derive(Debug, Serialize, From)]
#[expect(
    clippy::large_enum_variant,
    reason = "error type, only built on the failure path"
)]
pub enum ServiceError {
    DependencyMissing {
        dependency: String,
    },

    SlugNotUnique {
        slug: String,
    },

    ResourceStillInUse {
        resource: String,
        id: String,
    },

    UserIsAlreadyMemberOfAnotherTeam {
        name: String,
    },

    MissingEventGroup {
        user_id: Uuid,
        group: Group,
    },

    TeamSizeExceeded {
        expected: usize,
        actual: usize,
    },

    CannotUnassignAllAdmins {
        resource: String,
        id: String,
    },

    Forbidden {
        resource: String,
        id: String,
        action: String,
    },

    ProjectPreferenceDuplicate,

    ProjectPreferenceWrongCount {
        expected: usize,
        actual: usize,
    },

    DuplicateVote,

    WrongVotingValue {
        given_value: f64,
        requirements: String,
    },

    SidequestCooldown {
        expires_at: NaiveDateTime,
    },

    EventPhase {
        current_phase: EventPhase,
    },

    Matching {
        message: String,
    },

    TeamBlogLimitExceeded {
        resource: String,
        actual: usize,
        limit: usize,
    },

    UploadRateLimitExceeded,

    UploadContentLengthExceeded {
        size: i64,
        limit: i64,
    },

    UploadContentTypeNotAllowed,

    UploadIsAlreadyValidated,

    UploadMediaUsageMismatch {
        expected: MediaUsage,
        actual: MediaUsage,
    },

    MissingMasterAIAPIKey,

    Parsing {
        message: String,
    },
    WrongTechnicalRatingScore {
        given_score: f64,
        allowed_scores: String,
    },
    InvalidTechnicalQuestion {
        message: String,
    },

    ScoreCalculationError {
        message: String,
    },

    // region: external library errors
    #[from]
    Repository(RepositoryError),
    // endregion

    // region: external library errors
    #[from]
    Io(#[serde_as(as = "DisplayFromStr")] std::io::Error),

    #[from]
    TracingSetGlobalDefault(
        #[serde_as(as = "DisplayFromStr")] tracing::dispatcher::SetGlobalDefaultError,
    ),

    #[from]
    TracingAppenderRollingInit(
        #[serde_as(as = "DisplayFromStr")] tracing_appender::rolling::InitError,
    ),

    #[from]
    SeaORM(#[serde_as(as = "DisplayFromStr")] sea_orm::DbErr),

    #[from]
    SerdeJson(#[serde_as(as = "DisplayFromStr")] serde_json::Error),

    #[from]
    Crypto(#[serde_as(as = "DisplayFromStr")] aes_gcm::Error),
    // endregion
}

impl fmt::Display for ServiceError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{self:?}")
    }
}

impl std::error::Error for ServiceError {}
