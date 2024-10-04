use chrono::NaiveDateTime;
use derive_more::From;
use repositories::db::prelude::EventPhase;
use repositories::RepositoryError;
use serde::Serialize;
use serde_with::{serde_as, DisplayFromStr};
use std::fmt;

pub type ServiceResult<T> = Result<T, ServiceError>;

#[serde_as]
#[derive(Debug, Serialize, From)]
pub enum ServiceError {
    ResourceStillInUse {
        resource: String,
        id: String,
    },

    UserIsAlreadyMemberOfAnotherTeam {
        name: String,
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

    SidequestCooldown {
        expires_at: NaiveDateTime,
    },

    EventPhase {
        current_phase: EventPhase,
    },

    Matching {
        message: String,
    },


    // region: external library errors
    #[from]
    Repository(RepositoryError),
    // endregion

    // region: external library errors
    #[from]
    SeaORM(#[serde_as(as = "DisplayFromStr")] sea_orm::DbErr),
    // endregion
}

impl fmt::Display for ServiceError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{self:?}")
    }
}

impl std::error::Error for ServiceError {}
