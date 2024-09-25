use crate::*;
use derive_more::{Display, From};

pub type Result<T> = core::result::Result<T, Error>;

#[derive(Debug, Display, From)]
pub enum Error {
    #[from]
    Event(event::EventError),
}

impl std::error::Error for Error {}
