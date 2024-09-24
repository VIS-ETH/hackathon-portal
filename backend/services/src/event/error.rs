use derive_more::{Display, From};

pub type Result<T> = core::result::Result<T, Error>;

#[derive(Debug, Display)]
pub enum Error {
    EventNameNotUnique { name: String },

    EventSlugNotUnique { slug: String },
}

impl std::error::Error for Error {}
