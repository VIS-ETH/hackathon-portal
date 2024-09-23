use crate::config::BackendConfig;
use sea_orm::DatabaseConnection;
// use anyhow::Result;
use sea_orm::{Database};
use std::{thread, time};

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection
}



pub async fn create(config : &BackendConfig) -> AppState {

let second = time::Duration::from_secs(5);
loop {

    println!("Try connecting to database");
    let db = Database::connect(config.database_url.clone()).await;

    if let Ok(connection) = db {
        println!("Connected to database");
        return AppState {db: connection}
    }

    thread::sleep(second)
}
}
