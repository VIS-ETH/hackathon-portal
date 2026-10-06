mod matching;
pub mod models;
use crate::authorization::groups::Group;
use crate::authorization::AuthorizationService;
use crate::project::models::{Project, ProjectForCreate, ProjectForUpdate};
use crate::{ServiceError, ServiceResult};
use hackathon_portal_repositories::db::{
    db_project, db_stakeholder_project, db_team, db_user, EventRepository,
    ProjectPreferenceRepository, ProjectRepository, TeamRepository,
};
use hackathon_portal_repositories::DbRepository;
use matching::GroupAssignment;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, QueryFilter, Set, TransactionTrait};
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

        self.get_project(project.id).await
    }

    pub async fn get_projects(&self, event_id: Uuid) -> ServiceResult<Vec<Project>> {
        let projects = ProjectRepository::fetch_all_by_event_id_with_stakeholders(
            self.db_repo.conn(),
            event_id,
        )
        .await?;

        Ok(projects.into_iter().map(Project::from).collect())
    }

    pub async fn get_project(&self, project_id: Uuid) -> ServiceResult<Project> {
        let project = ProjectRepository::fetch_by_id(self.db_repo.conn(), project_id).await?;
        self.with_stakeholders(self.db_repo.conn(), project).await
    }

    pub async fn get_project_by_slug(
        &self,
        event_slug: &str,
        project_slug: &str,
    ) -> ServiceResult<Project> {
        let project =
            ProjectRepository::fetch_by_slug(self.db_repo.conn(), event_slug, project_slug).await?;
        self.with_stakeholders(self.db_repo.conn(), project).await
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

        if let Some(stakeholder_ids) = project_fu.stakeholder_ids {
            self.set_project_stakeholders(&txn, event_id, project_id, stakeholder_ids)
                .await?;
        }

        txn.commit().await?;

        self.get_project(project.id).await
    }

    async fn set_project_stakeholders<C: ConnectionTrait>(
        &self,
        db: &C,
        event_id: Uuid,
        project_id: Uuid,
        stakeholder_ids: Vec<Uuid>,
    ) -> ServiceResult<()> {
        let mut unique_ids = Vec::with_capacity(stakeholder_ids.len());
        for user_id in stakeholder_ids {
            if !unique_ids.contains(&user_id) {
                unique_ids.push(user_id);
            }
        }

        let current_ids = db_stakeholder_project::Entity::find()
            .filter(db_stakeholder_project::Column::ProjectId.eq(project_id))
            .all(db)
            .await?
            .into_iter()
            .map(|stakeholder| stakeholder.user_id)
            .collect::<Vec<_>>();

        // Only newly added stakeholders need the stakeholder event role,
        // so a revoked role doesn't block later edits of the project
        let required_event_groups = unique_ids
            .iter()
            .filter(|user_id| !current_ids.contains(user_id))
            .map(|user_id| (*user_id, Group::EventStakeholder))
            .collect::<Vec<_>>();

        AuthorizationService::ensure_event_groups(db, event_id, &required_event_groups).await?;

        db_stakeholder_project::Entity::delete_many()
            .filter(db_stakeholder_project::Column::ProjectId.eq(project_id))
            .exec(db)
            .await?;

        for user_id in unique_ids {
            db_stakeholder_project::ActiveModel {
                project_id: Set(project_id),
                user_id: Set(user_id),
            }
            .insert(db)
            .await?;
        }

        Ok(())
    }

    async fn with_stakeholders<C: ConnectionTrait>(
        &self,
        db: &C,
        project: db_project::Model,
    ) -> ServiceResult<Project> {
        let stakeholders = project.find_related(db_user::Entity).all(db).await?;

        Ok((project, stakeholders).into())
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
        let mut preference =
            ProjectPreferenceRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id)
                .await?
                .into_iter()
                .fold(
                    HashMap::<Uuid, HashMap<Uuid, i32>>::new(),
                    |mut acc, pref| {
                        acc.entry(pref.team_id)
                            .or_default()
                            .insert(pref.project_id, pref.score);
                        acc
                    },
                );

        // Teams without preferences still take part in the matching
        for team in teams {
            preference.entry(team.id).or_default();
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
