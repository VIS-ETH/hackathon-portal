mod matching;
pub mod models;
use crate::project::models::{Project, ProjectForCreate, ProjectForUpdate};
use crate::{ServiceError, ServiceResult};
use hackathon_portal_repositories::db::{
    db_project, db_team, EventRepository, ProjectPreferenceRepository, ProjectRepository,
    TeamRepository,
};
use hackathon_portal_repositories::DbRepository;
use matching::GroupAssignment;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, Set, TransactionTrait};
use slug::slugify;
use std::collections::HashMap;

#[derive(Clone)]
pub struct ProjectService {
    db_repo: DbRepository,
}

impl ProjectService {
    #[must_use]
    pub const fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn create_project(&self, project_fc: ProjectForCreate) -> ServiceResult<Project> {
        let txn = self.db_repo.conn().begin().await?;

        let slug = self
            .generate_slug(&txn, project_fc.event_id, &project_fc.name, None)
            .await?;

        let active_project = db_project::ActiveModel {
            event_id: Set(project_fc.event_id),
            name: Set(project_fc.name),
            slug: Set(slug),
            content: Set(project_fc.content),
            ..Default::default()
        };

        let project = active_project.insert(&txn).await?;

        txn.commit().await?;

        Ok(project.into())
    }

    pub async fn get_projects(&self, event_id: Uuid) -> ServiceResult<Vec<Project>> {
        let projects =
            ProjectRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id).await?;

        let projects = projects.into_iter().map(Project::from).collect();

        Ok(projects)
    }

    pub async fn get_project(&self, project_id: Uuid) -> ServiceResult<Project> {
        let project = ProjectRepository::fetch_by_id(self.db_repo.conn(), project_id).await?;
        Ok(project.into())
    }

    pub async fn get_project_by_slug(
        &self,
        event_slug: &str,
        project_slug: &str,
    ) -> ServiceResult<Project> {
        let project =
            ProjectRepository::fetch_by_slug(self.db_repo.conn(), event_slug, project_slug).await?;

        Ok(project.into())
    }

    pub async fn update_project(
        &self,
        project_id: Uuid,
        project_fu: ProjectForUpdate,
    ) -> ServiceResult<Project> {
        let txn = self.db_repo.conn().begin().await?;

        let project = ProjectRepository::fetch_by_id(&txn, project_id).await?;

        // Store for later use
        let event_id = project.event_id;

        let mut active_project = project.into_active_model();

        if let Some(name) = &project_fu.name {
            // Generate slug and check for naming conflicts
            let slug = self
                .generate_slug(&txn, event_id, name, Some(project_id))
                .await?;

            active_project.name = Set(name.clone());
            active_project.slug = Set(slug);
        }

        if let Some(content) = &project_fu.content {
            active_project.content = Set(content.clone());
        }

        let project = active_project.update(&txn).await?;

        txn.commit().await?;

        Ok(project.into())
    }

    /// Fails if the project is still assigned to a team.
    pub async fn delete_project(&self, project_id: Uuid) -> ServiceResult<()> {
        let project = ProjectRepository::fetch_by_id(self.db_repo.conn(), project_id).await?;

        let txn = self.db_repo.conn().begin().await?;

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

        project.delete(&txn).await?;
        txn.commit().await?;

        Ok(())
    }

    pub async fn get_matching(&self, event_id: Uuid) -> ServiceResult<HashMap<Uuid, Uuid>> {
        let projects =
            ProjectRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id).await?;
        let event = EventRepository::fetch_by_id(self.db_repo.conn(), event_id).await?;
        let project_ids = projects.into_iter().map(|p| p.id).collect::<Vec<_>>();

        let teams = TeamRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id).await?;
        let team_ids = teams.iter().map(|t| t.id).collect::<Vec<_>>();

        // Mapping from team_id -> project_id -> preference
        let mut preference = HashMap::<Uuid, HashMap<Uuid, i32>>::new();
        for team in teams {
            let team_pref =
                ProjectPreferenceRepository::fetch_all_by_team_id(self.db_repo.conn(), team.id)
                    .await?;

            let team_pref =
                team_pref
                    .into_iter()
                    .fold(HashMap::<Uuid, i32>::new(), |mut acc, pref| {
                        acc.insert(pref.project_id, pref.score);
                        acc
                    });
            preference.insert(team.id, team_pref);
        }

        let matching_problem = GroupAssignment::new(
            team_ids,
            project_ids,
            event.max_teams_per_project,
            preference,
        );

        let Some(mut matching) = matching_problem else {
            return Err(ServiceError::Matching {
                message: "failed to instantiate the problem.".to_string(),
            });
        };

        let solution = matching.solve();

        match solution {
            Ok(solution) => Ok(solution),
            Err(minilp::Error::Infeasible) => Err(ServiceError::Matching {
                message: ("no feasible solution found.".to_string()),
            }),
            Err(minilp::Error::Unbounded) => Err(ServiceError::Matching {
                message: ("problem is unbounded.".to_string()),
            }),
        }
    }

    async fn generate_slug<C: ConnectionTrait>(
        &self,
        db: &C,
        event_id: Uuid,
        name: &str,
        current_project_id: Option<Uuid>,
    ) -> ServiceResult<String> {
        let slug = slugify(name);

        let conflicting =
            ProjectRepository::count_conflicting_by_slug(db, &slug, event_id, current_project_id)
                .await?;

        if conflicting != 0 {
            return Err(ServiceError::SlugNotUnique { slug });
        }

        Ok(slug)
    }
}
