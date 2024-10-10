pub mod models;

use crate::authorization::AuthorizationService;
use crate::team::models::{Team, TeamForCreate, TeamForUpdate};
use crate::{ServiceError, ServiceResult};
use models::{TeamForUpdateInternal, TeamInternal};
use repositories::db::prelude::*;
use repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, Set, TransactionTrait};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

#[derive(Clone)]
pub struct TeamService {
    authorization_service: Arc<AuthorizationService>,
    db_repo: DbRepository,
}

impl TeamService {
    #[must_use]
    pub fn new(authorization_service: Arc<AuthorizationService>, db_repo: DbRepository) -> Self {
        Self {
            authorization_service,
            db_repo,
        }
    }

    pub async fn create_team(&self, creator: Uuid, team_fc: TeamForCreate) -> ServiceResult<Team> {
        // Generate slug and check for naming conflicts
        let slug = self
            .db_repo
            .generate_slug(&team_fc.name, Some(team_fc.event_id), db_team::Entity)
            .await?;

        let active_team = db_team::ActiveModel {
            event_id: Set(team_fc.event_id),
            name: Set(team_fc.name),
            slug: Set(slug),
            index: Set(0),
            ..Default::default()
        };

        let team = active_team.insert(self.db_repo.conn()).await?;

        // Assign creator as team member
        let auth_result = self
            .authorization_service
            .assign_team_roles(
                team.id,
                HashMap::from([(creator, HashSet::from([TeamRole::Member]))]),
            )
            .await;

        if let Err(err) = auth_result {
            // Rollback team creation
            team.delete(self.db_repo.conn()).await?;
            return Err(err);
        }

        Ok(team.into())
    }

    pub async fn get_teams(&self, event_id: Uuid) -> ServiceResult<Vec<Team>> {
        let teams = self.db_repo.get_teams(event_id).await?;
        let teams = teams.into_iter().map(Team::from).collect();

        Ok(teams)
    }

    pub async fn get_teams_internal(&self, event_id: Uuid) -> ServiceResult<Vec<TeamInternal>> {
        let teams = self.db_repo.get_teams(event_id).await?;
        let teams = teams.into_iter().map(TeamInternal::from).collect();
        Ok(teams)
    }

    pub async fn get_team(&self, team_id: Uuid) -> ServiceResult<Team> {
        let team = self.db_repo.get_team(team_id).await?;
        Ok(team.into())
    }

    pub async fn get_team_internal(&self, team_id: Uuid) -> ServiceResult<TeamInternal> {
        let team = self.db_repo.get_team(team_id).await?;
        Ok(team.into())
    }

    pub async fn get_team_by_slug(&self, event_slug: &str, team_slug: &str) -> ServiceResult<Team> {
        let team = self.db_repo.get_team_by_slug(event_slug, team_slug).await?;
        Ok(team.into())
    }

    pub async fn update_team(&self, team_id: Uuid, team_fu: TeamForUpdate) -> ServiceResult<Team> {
        let team = self.db_repo.get_team(team_id).await?;

        // Store for later use
        let event_id = team.event_id;

        let mut active_team = team.into_active_model();

        if let Some(name) = &team_fu.name {
            // Generate slug and check for naming conflicts
            let slug = self
                .db_repo
                .generate_slug(name, Some(event_id), db_team::Entity)
                .await?;

            active_team.name = Set(name.clone());
            active_team.slug = Set(slug);
        }

        let team = active_team.update(self.db_repo.conn()).await?;

        Ok(team.into())
    }

    pub async fn update_team_internal(
        &self,
        team_id: Uuid,
        team_fui: TeamForUpdateInternal,
    ) -> ServiceResult<TeamInternal> {
        let team = self.db_repo.get_team(team_id).await?;
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
        let team = self.db_repo.get_team(team_id).await?;

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
        let mut teams = self.db_repo.get_teams(event_id).await?;
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
        let team = self.db_repo.get_team(team_id).await?;
        let mut active_team = team.into_active_model();
        active_team.project_id = Set(project_id);

        let team = active_team.update(self.db_repo.conn()).await?;

        Ok(team.into())
    }

    pub async fn get_team_project_preferences(&self, team_id: Uuid) -> ServiceResult<Vec<Uuid>> {
        let pps = self.db_repo.get_project_preferences(team_id).await?;

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

    pub async fn get_team_password(&self, team_id: Uuid) -> ServiceResult<Option<String>> {
        let team = self.db_repo.get_team(team_id).await?;
        Ok(team.password)
    }

    pub async fn update_team_password(
        &self,
        team_id: Uuid,
        password: Option<String>,
    ) -> ServiceResult<Team> {
        let team = self.db_repo.get_team(team_id).await?;
        let mut active_team = team.into_active_model();
        active_team.password = Set(password);

        let team = active_team.update(self.db_repo.conn()).await?;

        Ok(team.into())
    }
}
