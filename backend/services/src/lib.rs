pub mod appointment;
pub mod authorization;
pub mod error;
pub mod event;
pub mod health;
pub mod project;
pub mod rating;
pub mod sidequest;
pub mod team;
pub mod upload;
pub mod user;
mod utils;

pub use error::{ServiceError, ServiceResult};
