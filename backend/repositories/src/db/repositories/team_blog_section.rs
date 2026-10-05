use crate::db::generated::team_blog_section;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::QueryOrder;

pub struct TeamBlogSectionRepository;

impl TeamBlogSectionRepository {
    pub async fn fetch_all_by_team_id<C: ConnectionTrait>(
        db: &C,
        team_id: Uuid,
    ) -> RepositoryResult<Vec<team_blog_section::Model>> {
        team_blog_section::Entity::find()
            .filter(team_blog_section::Column::TeamId.eq(team_id))
            .order_by_asc(team_blog_section::Column::Position)
            .all(db)
            .await
            .map_err(RepositoryError::from)
    }
}
