use derive_more::{Display, From};

pub type Result<T> = core::result::Result<T, Error>;

#[derive(Debug, Display, From)]
pub enum Error {
    #[from]
    SeaORM(sea_orm::DbErr),
}

impl std::error::Error for Error {}
