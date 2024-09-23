pub mod error;

pub use error::{Error, Result};

pub struct EventService {}

impl EventService {
    pub fn new() -> EventService {
        EventService {}
    }

    pub fn create(&self) {
        println!("Event created");
    }
}
