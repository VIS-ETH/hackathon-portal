use chrono::NaiveDateTime;
use derive_more::From;
use repositories::db::prelude::EventPhase;
use serde::Serialize;
use serde_with::{serde_as, DisplayFromStr};
use std::{collections::HashSet, fmt};

pub type ServiceResult<T> = Result<T, ServiceError>;

#[serde_as]
#[derive(Debug, Serialize, From)]
pub enum ServiceError {
    RegularUserRequired,
    ServiceUserRequired,

    NameNotUnique {
        name: String,
    },

    SlugNotUnique {
        slug: String,
    },

    ResourceNotFound {
        resource: String,
        id: String,
    },

    Forbidden {
        resource: String,
        id: String,
        action: String,
    },

    SidequestCooldown {
        allowed_at: NaiveDateTime,
    },

    EventPhase {
        current_phase: EventPhase,
    },

    // region: external library errors
    #[from]
    SeaORM(#[serde_as(as = "DisplayFromStr")] sea_orm::DbErr),
    // endregion
}

impl fmt::Display for ServiceError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl std::error::Error for ServiceError {}
