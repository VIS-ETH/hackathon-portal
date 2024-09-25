use derive_more::{Display, From};

pub type Result<T> = core::result::Result<T, EventError>;

#[derive(Debug, Clone, Display)]
pub enum EventError {
    EventNameNotUnique { name: String },

    EventSlugNotUnique { slug: String },
}

impl std::error::Error for EventError {}
