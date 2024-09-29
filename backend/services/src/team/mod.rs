pub mod model;

use crate::authorization::AuthorizationService;
use crate::team::model::{ProjectPreferences, Team, TeamForCreate, TeamForUpdate};
use crate::{ServiceError, ServiceResult};
use repositories::db::prelude::*;
use repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, QueryOrder, Set, TransactionTrait};
use slug::slugify;
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

#[derive(Clone)]
pub struct TeamService {
    authorization_service: Arc<AuthorizationService>,
    db_repo: DbRepository,
}

impl TeamService {
    pub fn new(authorization_service: Arc<AuthorizationService>, db_repo: DbRepository) -> Self {
        Self {
            authorization_service,
            db_repo,
        }
    }

    pub async fn create_team(&self, creator: Uuid, team_fc: TeamForCreate) -> ServiceResult<Team> {
        let slug = self.generate_slug(&team_fc.name, team_fc.event_id).await?;

        let active_team = db_team::ActiveModel {
            event_id: Set(team_fc.event_id),
            name: Set(team_fc.name),
            slug: Set(slug),
            index: Set(0),
            ..Default::default()
        };

        let team = active_team.insert(self.db_repo.conn()).await?;

        self.authorization_service
            .assign_team_roles(
                team.id,
                HashMap::from([(creator, HashSet::from([TeamRole::Member]))]),
            )
            .await?;

        Ok(team.into())
    }

    pub async fn get_teams(&self, event_id: Uuid) -> ServiceResult<Vec<Team>> {
        let teams = self.get_db_teams(event_id).await?;
        let teams = teams.into_iter().map(Team::from).collect();

        Ok(teams)
    }

    pub async fn get_team(&self, team_id: Uuid) -> ServiceResult<Team> {
        let team = self.get_db_team(team_id).await?;
        Ok(team.into())
    }

    pub async fn get_team_by_slug(&self, event_slug: &str, team_slug: &str) -> ServiceResult<Team> {
        let team = self.get_db_team_by_slug(event_slug, team_slug).await?;
        Ok(team.into())
    }

    pub async fn update_team(&self, team_id: Uuid, team_fc: TeamForUpdate) -> ServiceResult<Team> {
        let team = self.get_db_team(team_id).await?;
        let event_id = team.event_id;
        let mut active_team = team.into_active_model();

        if let Some(name) = &team_fc.name {
            let slug = self.generate_slug(name, event_id).await?;
            active_team.name = Set(name.clone());
            active_team.slug = Set(slug);
        }

        let team = active_team.update(self.db_repo.conn()).await?;

        Ok(team.into())
    }

    /// Cascade deletes all team role assignments and fails on any other remaining dependencies.
    pub async fn delete_team(&self, team_id: Uuid) -> ServiceResult<()> {
        let team = self.get_db_team(team_id).await?;
        let txn = self.db_repo.conn().begin().await?;

        db_team_role_assignment::Entity::delete_many()
            .filter(db_team_role_assignment::Column::TeamId.eq(team_id))
            .exec(&txn)
            .await?;

        let project_preferences = team
            .find_related(db_project_preference::Entity)
            .count(&txn)
            .await?;

        let sidequest_attempts = team
            .find_related(db_sidequest_attempt::Entity)
            .count(&txn)
            .await?;

        let sidequest_scores = team
            .find_related(db_sidequest_score::Entity)
            .count(&txn)
            .await?;

        if project_preferences + sidequest_attempts + sidequest_scores > 0 {
            return Err(ServiceError::ResourceStillInUse {
                resource: "Team".to_string(),
                id: team_id.to_string(),
            });
        }

        team.delete(&txn).await?;
        txn.commit().await?;

        Ok(())
    }

    pub async fn reindex_teams(&self, event_id: Uuid) -> ServiceResult<Vec<Team>> {
        let teams = self.get_db_teams(event_id).await?;
        let mut new_teams = Vec::new();

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
        let team = self.get_db_team(team_id).await?;
        let mut active_team = team.into_active_model();
        active_team.project_id = Set(project_id);

        let team = active_team.update(self.db_repo.conn()).await?;

        Ok(team.into())
    }

    pub async fn get_team_project_preferences(
        &self,
        team_id: Uuid,
    ) -> ServiceResult<ProjectPreferences> {
        let pps = db_project_preference::Entity::find()
            .filter(db_project_preference::Column::TeamId.eq(team_id))
            .order_by_asc(db_project_preference::Column::Score)
            .all(self.db_repo.conn())
            .await?;

        let pps = ProjectPreferences {
            project_preferences: pps.into_iter().map(|pp| pp.project_id).collect(),
        };

        Ok(pps)
    }

    pub async fn update_team_project_preferences(
        &self,
        team_id: Uuid,
        pps: ProjectPreferences,
    ) -> ServiceResult<ProjectPreferences> {
        let set = pps
            .project_preferences
            .iter()
            .collect::<std::collections::HashSet<_>>();
        let mut new_pps = Vec::new();

        if set.len() != pps.project_preferences.len() {
            return Err(ServiceError::ProjectPreferenceDuplicate);
        }

        if set.len() != 3 {
            return Err(ServiceError::ProjectPreferenceWrongCount {
                expected: 3,
                actual: set.len(),
            });
        }

        let txn = self.db_repo.conn().begin().await?;

        db_project_preference::Entity::delete_many()
            .filter(db_project_preference::Column::TeamId.eq(team_id))
            .exec(&txn)
            .await?;

        for (index, project_id) in pps.project_preferences.iter().enumerate() {
            let active_pp = db_project_preference::ActiveModel {
                team_id: Set(team_id),
                project_id: Set(*project_id),
                score: Set(index as i32),
                ..Default::default()
            };

            let pp = active_pp.insert(&txn).await?;
            new_pps.push(pp);
        }

        txn.commit().await?;

        let pps = ProjectPreferences {
            project_preferences: new_pps.into_iter().map(|pp| pp.project_id).collect(),
        };

        Ok(pps)
    }

    pub async fn get_team_password(&self, team_id: Uuid) -> ServiceResult<Option<String>> {
        let team = self.get_db_team(team_id).await?;
        Ok(team.password)
    }

    pub async fn update_team_password(
        &self,
        team_id: Uuid,
        password: Option<String>,
    ) -> ServiceResult<Team> {
        let team = self.get_db_team(team_id).await?;
        let mut active_team = team.into_active_model();
        active_team.password = Set(password);

        let team = active_team.update(self.db_repo.conn()).await?;

        Ok(team.into())
    }

    async fn get_db_teams(&self, event_id: Uuid) -> ServiceResult<Vec<db_team::Model>> {
        let teams = db_team::Entity::find()
            .filter(db_team::Column::EventId.eq(event_id))
            .order_by_asc(db_team::Column::Index)
            .order_by_asc(db_team::Column::Id)
            .all(self.db_repo.conn())
            .await?;

        Ok(teams)
    }

    async fn get_db_team(&self, team_id: Uuid) -> ServiceResult<db_team::Model> {
        let team = db_team::Entity::find()
            .filter(db_team::Column::Id.eq(team_id))
            .one(self.db_repo.conn())
            .await?
            .ok_or_else(|| ServiceError::ResourceNotFound {
                resource: "Team".to_string(),
                id: team_id.to_string(),
            })?;

        Ok(team)
    }

    async fn get_db_team_by_slug(
        &self,
        event_slug: &str,
        team_slug: &str,
    ) -> ServiceResult<db_team::Model> {
        let team = db_team::Entity::find()
            .inner_join(db_event::Entity)
            .filter(db_event::Column::Slug.eq(event_slug))
            .filter(db_team::Column::Slug.eq(team_slug))
            .one(self.db_repo.conn())
            .await?
            .ok_or_else(|| ServiceError::ResourceNotFound {
                resource: "Team".to_string(),
                id: format!("{}/{}", event_slug, team_slug),
            })?;

        Ok(team)
    }

    async fn generate_slug(&self, name: &str, event_id: Uuid) -> ServiceResult<String> {
        let slug = slugify(name);

        let existing = db_team::Entity::find()
            .filter(db_team::Column::EventId.eq(event_id))
            .filter(db_team::Column::Slug.eq(slug.clone()))
            .one(self.db_repo.conn())
            .await?;

        if existing.is_some() {
            Err(ServiceError::SlugNotUnique { slug })
        } else {
            Ok(slug)
        }
    }
}
