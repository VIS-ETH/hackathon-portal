pub mod model;

use crate::project::model::{Project, ProjectForCreate, ProjectForUpdate};
use crate::{ServiceError, ServiceResult};
use repositories::db::prelude::*;
use repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, QueryOrder, Set};
use slug::slugify;

#[derive(Clone)]
pub struct ProjectService {
    db_repo: DbRepository,
}

impl ProjectService {
    pub fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn create_project(&self, project_fc: ProjectForCreate) -> ServiceResult<Project> {
        let slug = self
            .generate_slug(&project_fc.name, project_fc.event_id)
            .await?;

        let active_project = db_project::ActiveModel {
            event_id: Set(project_fc.event_id),
            name: Set(project_fc.name),
            slug: Set(slug),
            content: Set(project_fc.content),
            ..Default::default()
        };

        let project = active_project.insert(self.db_repo.conn()).await?;

        Ok(project.into())
    }

    pub async fn get_projects(&self, event_id: Uuid) -> ServiceResult<Vec<Project>> {
        let projects = db_project::Entity::find()
            .filter(db_project::Column::EventId.eq(event_id))
            .order_by_asc(db_project::Column::Name)
            .all(self.db_repo.conn())
            .await?;

        let projects = projects.into_iter().map(Project::from).collect();

        Ok(projects)
    }

    pub async fn get_project(&self, project_id: Uuid) -> ServiceResult<Project> {
        let project = self.get_db_project(project_id).await?;
        Ok(project.into())
    }

    pub async fn get_project_by_slug(
        &self,
        event_slug: &str,
        project_slug: &str,
    ) -> ServiceResult<Project> {
        let project = self
            .get_db_project_by_slug(event_slug, project_slug)
            .await?;
        Ok(project.into())
    }

    pub async fn update_project(
        &self,
        project_id: Uuid,
        project_fu: ProjectForUpdate,
    ) -> ServiceResult<Project> {
        let project = self.get_db_project(project_id).await?;
        let event_id = project.event_id;
        let mut active_project = project.into_active_model();

        if let Some(name) = &project_fu.name {
            let slug = self.generate_slug(name, event_id).await?;
            active_project.name = Set(name.clone());
            active_project.slug = Set(slug);
        }

        if let Some(content) = &project_fu.content {
            active_project.content = Set(content.clone());
        }

        let project = active_project.update(self.db_repo.conn()).await?;

        Ok(project.into())
    }

    pub async fn delete_project(&self, project_id: Uuid) -> ServiceResult<()> {
        let project = self.get_db_project(project_id).await?;
        let teams = project
            .find_related(db_team::Entity)
            .count(self.db_repo.conn())
            .await?;

        if teams > 0 {
            return Err(ServiceError::ResourceStillInUse {
                resource: "Project".to_string(),
                id: project_id.to_string(),
            });
        }

        project.delete(self.db_repo.conn()).await?;

        Ok(())
    }

    async fn get_db_project(&self, project_id: Uuid) -> ServiceResult<db_project::Model> {
        let project = db_project::Entity::find()
            .filter(db_project::Column::Id.eq(project_id))
            .one(self.db_repo.conn())
            .await?
            .ok_or_else(|| ServiceError::ResourceNotFound {
                resource: "Project".to_string(),
                id: project_id.to_string(),
            })?;

        Ok(project)
    }

    async fn get_db_project_by_slug(
        &self,
        event_slug: &str,
        project_slug: &str,
    ) -> ServiceResult<db_project::Model> {
        let project = db_project::Entity::find()
            .inner_join(db_event::Entity)
            .filter(db_event::Column::Slug.eq(event_slug))
            .filter(db_project::Column::Slug.eq(project_slug))
            .one(self.db_repo.conn())
            .await?
            .ok_or_else(|| ServiceError::ResourceNotFound {
                resource: "Project".to_string(),
                id: format!("{}/{}", event_slug, project_slug),
            })?;

        Ok(project)
    }

    async fn generate_slug(&self, name: &str, event_id: Uuid) -> ServiceResult<String> {
        let slug = slugify(name);

        let existing = db_project::Entity::find()
            .filter(db_project::Column::EventId.eq(event_id))
            .filter(db_project::Column::Slug.eq(slug.clone()))
            .one(self.db_repo.conn())
            .await?;

        if existing.is_some() {
            Err(ServiceError::SlugNotUnique { slug })
        } else {
            Ok(slug)
        }
    }
}
