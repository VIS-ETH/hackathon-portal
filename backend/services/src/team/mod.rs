pub mod models;

use crate::authorization::AuthorizationService;
use crate::team::models::{Team, TeamCredentials, TeamForCreate, TeamForUpdate};
use crate::upload::UploadService;
use crate::{ServiceError, ServiceResult};
use hackathon_portal_repositories::db::{
    db_project_preference, db_sidequest_score, db_team, db_team_role_assignment, MediaUsage,
    ProjectPreferenceRepository, TeamRepository, TeamRole,
};
use hackathon_portal_repositories::DbRepository;
use models::{TeamForUpdateInternal, TeamInternal};
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, Set, TransactionTrait};
use slug::slugify;
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

#[derive(Clone)]
pub struct TeamService {
    authorization_service: Arc<AuthorizationService>,
    upload_service: Arc<UploadService>,
    db_repo: DbRepository,
}

impl TeamService {
    #[must_use]
    pub fn new(
        authorization_service: Arc<AuthorizationService>,
        upload_service: Arc<UploadService>,
        db_repo: DbRepository,
    ) -> Self {
        Self {
            authorization_service,
            upload_service,
            db_repo,
        }
    }

    pub async fn create_team(&self, creator: Uuid, team_fc: TeamForCreate) -> ServiceResult<Team> {
        let txn = self.db_repo.conn().begin().await?;

        // Generate slug and check for naming conflicts
        let slug = self
            .generate_slug(&txn, team_fc.event_id, &team_fc.name, None)
            .await?;

        let active_team = db_team::ActiveModel {
            event_id: Set(team_fc.event_id),
            name: Set(team_fc.name),
            slug: Set(slug),
            index: Set(0),
            ..Default::default()
        };

        let team = active_team.insert(&txn).await?;

        // Assign creator as team member
        let auth_result = self
            .authorization_service
            .assign_team_roles(
                team.id,
                HashMap::from([(creator, HashSet::from([TeamRole::Member]))]),
            )
            .await;

        if let Err(err) = auth_result {
            txn.rollback().await?;
            return Err(err);
        }

        txn.commit().await?;

        let mut team = Team::from(team);
        self.inject_photo_url(&mut team).await?;

        Ok(team)
    }

    pub async fn get_teams(
        &self,
        event_id: Uuid,
        project_assignments_visible: bool,
    ) -> ServiceResult<Vec<Team>> {
        let teams = TeamRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id).await?;
        let mut teams = teams.into_iter().map(Team::from).collect::<Vec<_>>();

        for team in &mut teams {
            self.inject_photo_url(team).await?;
        }

        if !project_assignments_visible {
            for team in &mut teams {
                team.project_id = None;
            }
        }

        Ok(teams)
    }

    pub async fn get_teams_internal(
        &self,
        event_id: Uuid,
        project_assignments_visible: bool,
    ) -> ServiceResult<Vec<TeamInternal>> {
        let teams = TeamRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id).await?;
        let mut teams = teams
            .into_iter()
            .map(TeamInternal::from)
            .collect::<Vec<_>>();

        if !project_assignments_visible {
            for team in &mut teams {
                team.project_id = None;
            }
        }

        Ok(teams)
    }

    pub async fn get_team(
        &self,
        team_id: Uuid,
        project_assignments_visible: bool,
    ) -> ServiceResult<Team> {
        let team = TeamRepository::fetch_by_id(self.db_repo.conn(), team_id).await?;
        let mut team = Team::from(team);

        self.inject_photo_url(&mut team).await?;

        if !project_assignments_visible {
            team.project_id = None;
        }

        Ok(team)
    }

    pub async fn get_team_internal(
        &self,
        team_id: Uuid,
        project_assignments_visible: bool,
    ) -> ServiceResult<TeamInternal> {
        let mut team = TeamRepository::fetch_by_id(self.db_repo.conn(), team_id).await?;

        if !project_assignments_visible {
            team.project_id = None;
        }

        Ok(team.into())
    }

    pub async fn get_team_by_slug(
        &self,
        event_slug: &str,
        team_slug: &str,
        project_assignments_visible: bool,
    ) -> ServiceResult<Team> {
        let team =
            TeamRepository::fetch_by_slug(self.db_repo.conn(), event_slug, team_slug).await?;

        let mut team = Team::from(team);

        self.inject_photo_url(&mut team).await?;

        if !project_assignments_visible {
            team.project_id = None;
        }

        Ok(team)
    }

    pub async fn update_team(&self, team_id: Uuid, team_fu: TeamForUpdate) -> ServiceResult<Team> {
        let txn = self.db_repo.conn().begin().await?;

        let team = TeamRepository::fetch_by_id(&txn, team_id).await?;

        // Store for later use
        let event_id = team.event_id;

        let mut active_team = team.into_active_model();

        if let Some(name) = &team_fu.name {
            // Generate slug and check for naming conflicts
            let slug = self
                .generate_slug(&txn, event_id, name, Some(team_id))
                .await?;

            active_team.name = Set(name.clone());
            active_team.slug = Set(slug);
        }

        if let Some(photo_id) = &team_fu.photo_id {
            if photo_id.is_nil() {
                active_team.photo_id = Set(None);
            } else {
                self.upload_service
                    .validate_upload(*photo_id, MediaUsage::TeamPhoto, false)
                    .await?;

                active_team.photo_id = Set(Some(*photo_id));
            }
        }

        let team = active_team.update(&txn).await?;

        txn.commit().await?;

        let mut team = Team::from(team);
        self.inject_photo_url(&mut team).await?;

        Ok(team)
    }

    pub async fn update_team_internal(
        &self,
        team_id: Uuid,
        team_fui: TeamForUpdateInternal,
    ) -> ServiceResult<TeamInternal> {
        let team = TeamRepository::fetch_by_id(self.db_repo.conn(), team_id).await?;
        let mut active_team = team.into_active_model();
        if let Some(comment) = &team_fui.comment {
            active_team.comment = Set(Some(comment.clone()));
        }
        if let Some(extra_score) = &team_fui.extra_score {
            active_team.extra_score = Set(Some(*extra_score));
        }
        let team = active_team.update(self.db_repo.conn()).await?;
        Ok(team.into())
    }

    /// Cascade deletes team role assignments and project preferences.
    /// Fails on any other related resources.
    pub async fn delete_team(&self, team_id: Uuid) -> ServiceResult<()> {
        let team = TeamRepository::fetch_by_id(self.db_repo.conn(), team_id).await?;

        let txn = self.db_repo.conn().begin().await?;

        db_team_role_assignment::Entity::delete_many()
            .filter(db_team_role_assignment::Column::TeamId.eq(team_id))
            .exec(&txn)
            .await?;

        db_project_preference::Entity::delete_many()
            .filter(db_project_preference::Column::TeamId.eq(team_id))
            .exec(&txn)
            .await?;

        let sidequest_scores = team
            .find_related(db_sidequest_score::Entity)
            .count(&txn)
            .await?;

        if sidequest_scores > 0 {
            return Err(ServiceError::ResourceStillInUse {
                resource: "Team".to_string(),
                id: team_id.to_string(),
            });
        }

        team.delete(&txn).await?;
        txn.commit().await?;

        Ok(())
    }

    /// (Re)assigns the team indices (1-based) based on the ascending ordering of the team's `project_id` and `id`.
    /// Warning: This must only be called if the event has never left the REGISTRATION phase (e.g. since the VM domain depends on the team indices).
    pub async fn index_teams(&self, event_id: Uuid) -> ServiceResult<Vec<Team>> {
        let mut teams =
            TeamRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id).await?;
        let mut new_teams = Vec::new();

        teams.sort_by(|a, b| {
            a.project_id
                .cmp(&b.project_id)
                .then_with(|| a.id.cmp(&b.id))
        });

        let txn = self.db_repo.conn().begin().await?;

        for (index, team) in teams.into_iter().enumerate() {
            let mut active_team = team.into_active_model();
            active_team.index = Set(index as i32 + 1);
            let team = active_team.update(&txn).await?;

            new_teams.push(team);
        }

        txn.commit().await?;

        let new_teams = new_teams.into_iter().map(Team::from).collect();

        Ok(new_teams)
    }

    pub async fn update_team_project(
        &self,
        team_id: Uuid,
        project_id: Option<Uuid>,
    ) -> ServiceResult<Team> {
        let team = TeamRepository::fetch_by_id(self.db_repo.conn(), team_id).await?;
        let mut active_team = team.into_active_model();
        active_team.project_id = Set(project_id);

        let team = active_team.update(self.db_repo.conn()).await?;

        Ok(team.into())
    }

    pub async fn get_team_project_preferences(&self, team_id: Uuid) -> ServiceResult<Vec<Uuid>> {
        let pps =
            ProjectPreferenceRepository::fetch_all_by_team_id(self.db_repo.conn(), team_id).await?;

        let pps = pps.into_iter().map(|pp| pp.project_id).collect();

        Ok(pps)
    }

    pub async fn update_team_project_preferences(
        &self,
        team_id: Uuid,
        pps: Vec<Uuid>,
    ) -> ServiceResult<Vec<Uuid>> {
        let set = pps.iter().collect::<HashSet<_>>();

        if set.len() != pps.len() {
            return Err(ServiceError::ProjectPreferenceDuplicate);
        }

        if set.len() != 3 {
            return Err(ServiceError::ProjectPreferenceWrongCount {
                expected: 3,
                actual: set.len(),
            });
        }

        let mut new_pps = Vec::new();
        let txn = self.db_repo.conn().begin().await?;

        db_project_preference::Entity::delete_many()
            .filter(db_project_preference::Column::TeamId.eq(team_id))
            .exec(&txn)
            .await?;

        for (index, project_id) in pps.iter().enumerate() {
            let active_pp = db_project_preference::ActiveModel {
                team_id: Set(team_id),
                project_id: Set(*project_id),
                score: Set(index as i32),
            };

            let pp = active_pp.insert(&txn).await?;
            new_pps.push(pp);
        }

        txn.commit().await?;

        let pps = new_pps.into_iter().map(|pp| pp.project_id).collect();

        Ok(pps)
    }

    pub async fn get_team_credentials(&self, team_id: Uuid) -> ServiceResult<TeamCredentials> {
        let team = TeamRepository::fetch_by_id(self.db_repo.conn(), team_id).await?;
        Ok(TeamCredentials {
            vm_password: team.password,
            ai_api_key: team.ai_api_key,
        })
    }

    pub async fn update_team_credentials(
        &self,
        team_id: Uuid,
        credentials: TeamCredentials,
    ) -> ServiceResult<Team> {
        let team = TeamRepository::fetch_by_id(self.db_repo.conn(), team_id).await?;
        let mut active_team = team.into_active_model();
        if credentials.vm_password.is_some() {
            active_team.password = Set(credentials.vm_password);
        }
        if credentials.ai_api_key.is_some() {
            active_team.ai_api_key = Set(credentials.ai_api_key);
        }

        let team = active_team.update(self.db_repo.conn()).await?;

        Ok(team.into())
    }

    async fn inject_photo_url(&self, team: &mut Team) -> ServiceResult<()> {
        self.upload_service
            .inject_url_opt(team.photo_url.as_mut())
            .await
    }

    async fn generate_slug<C: ConnectionTrait>(
        &self,
        db: &C,
        event_id: Uuid,
        name: &str,
        current_team_id: Option<Uuid>,
    ) -> ServiceResult<String> {
        let slug = slugify(name);

        let conflicting =
            TeamRepository::count_conflicting_by_slug(db, &slug, event_id, current_team_id).await?;

        if conflicting != 0 {
            return Err(ServiceError::SlugNotUnique { slug });
        }

        Ok(slug)
    }
}
