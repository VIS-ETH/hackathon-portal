pub mod model;

use crate::user::model::UserForCreate;
use crate::utils::try_insert_result_to_int;
use crate::ServiceResult;
use model::SidequestForCreate;
use repositories::db::prelude::*;
use repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::sea_query::OnConflict;
use sea_orm::Set;
use slug::slugify;

#[derive(Clone)]
pub struct SidequestService {
    db_repo: DbRepository,
}

impl SidequestService {
    pub fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn create_sidequest(&self, sidequest: SidequestForCreate) -> ServiceResult<u64> {
        let active_sidequest = db_sidequest::ActiveModel {
            event_id: Set(sidequest.event_id),
            name: Set(sidequest.name.clone()),
            description: Set(sidequest.description),
            is_higher_result_better: Set(sidequest.is_higher_result_better),
            slug: Set(slugify(&sidequest.name)),
            ..Default::default()
        };

        let result = db_sidequest::Entity::insert(active_sidequest)
            .exec_without_returning(self.db_repo.conn())
            .await?;

        Ok(result)
    }

    pub async fn get_sidequests(&self, event_id: Uuid) -> ServiceResult<Vec<db_sidequest::Model>> {
        let sidequests = db_sidequest::Entity::find()
            .filter(db_sidequest::Column::EventId.eq(event_id))
            .all(self.db_repo.conn())
            .await?;
        Ok(sidequests)
    }

    // pub async fn create_users(&self, users: Vec<UserForCreate>) -> ServiceResult<u64> {
    //     let active_users = users.into_iter().map(|user| {
    //         let name = user
    //             .name
    //             .clone()
    //             .unwrap_or_else(|| self.get_default_name(&user.auth_id));

    //         db_user::ActiveModel {
    //             auth_id: Set(user.auth_id),
    //             name: Set(name),
    //             ..Default::default()
    //         }
    //     });

    //     let result = db_user::Entity::insert_many(active_users)
    //         .on_conflict(
    //             OnConflict::columns(vec![db_user::Column::AuthId])
    //                 .do_nothing()
    //                 .to_owned(),
    //         )
    //         .on_empty_do_nothing()
    //         .exec_without_returning(self.db_repo.conn())
    //         .await?;

    //     Ok(try_insert_result_to_int(result))
    // }

    // pub async fn get_or_create_user(&self, auth_id: &str) -> ServiceResult<db_user::Model> {
    //     let user = db_user::Entity::find()
    //         .filter(db_user::Column::AuthId.eq(auth_id))
    //         .one(self.db_repo.conn())
    //         .await?;

    //     if let Some(user) = user {
    //         return Ok(user);
    //     }

    //     let active_user = db_user::ActiveModel {
    //         auth_id: Set(auth_id.to_string()),
    //         name: Set(self.get_default_name(auth_id)),
    //         ..Default::default()
    //     };

    //     let user = db_user::Entity::insert(active_user)
    //         .exec_with_returning(self.db_repo.conn())
    //         .await?;

    //     Ok(user)
    // }

    // pub fn get_default_name(&self, auth_id: &str) -> String {
    //     auth_id.split('@').next().unwrap_or(auth_id).to_string()
    // }
}
