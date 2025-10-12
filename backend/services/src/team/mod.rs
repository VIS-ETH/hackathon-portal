pub mod models;

use crate::authorization::AuthorizationService;
use crate::crypto::CryptoService;
use crate::infrastructure::models::IngressConfig;
use crate::team::models::{Team, TeamForCreate, TeamForUpdate};
use crate::upload::UploadService;
use crate::{ServiceError, ServiceResult};
use futures::future::try_join_all;
use hackathon_portal_repositories::db::{
    db_event, db_project_preference, db_sidequest_score, db_team, db_team_role_assignment,
    EventRepository, MediaUsage, ProjectPreferenceRepository, TeamRepository, TeamRole,
};
use hackathon_portal_repositories::lite_llm::LiteLLMRepository;
use hackathon_portal_repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, Set, TransactionTrait};
use slug::slugify;
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

#[derive(Clone)]
pub struct TeamService {
    authorization_service: Arc<AuthorizationService>,
    upload_service: Arc<UploadService>,
    crypto_service: Arc<CryptoService>,
    db_repo: DbRepository,
    lite_llm_repo: LiteLLMRepository,
}

impl TeamService {
    #[must_use]
    pub fn new(
        authorization_service: Arc<AuthorizationService>,
        upload_service: Arc<UploadService>,
        crypto_service: Arc<CryptoService>,
        db_repo: DbRepository,
        lite_llm_repo: LiteLLMRepository,
    ) -> Self {
        Self {
            authorization_service,
            upload_service,
            crypto_service,
            db_repo,
            lite_llm_repo,
        }
    }

    pub async fn create_team(&self, creator: Uuid, team_fc: TeamForCreate) -> ServiceResult<Team> {
        let txn = self.db_repo.conn().begin().await?;

        let event = EventRepository::fetch_by_id(&txn, team_fc.event_id).await?;

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

        txn.commit().await?;

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

        let team = self.assemble_team(team, &event).await?;

        Ok(team)
    }

    pub async fn get_all_teams(&self) -> ServiceResult<Vec<Team>> {
        let events = EventRepository::fetch_all(self.db_repo.conn())
            .await?
            .into_iter()
            .map(|e| (e.id, e))
            .collect::<HashMap<_, _>>();

        let teams = TeamRepository::fetch_all(self.db_repo.conn()).await?;

        try_join_all(teams.into_iter().map(|team| {
            let event = events
                .get(&team.event_id)
                .expect("Foreign key constraint ensures event exists");

            self.assemble_team(team, event)
        }))
        .await
    }

    pub async fn get_teams(&self, event_id: Uuid) -> ServiceResult<Vec<Team>> {
        let event = EventRepository::fetch_by_id(self.db_repo.conn(), event_id).await?;
        let teams = TeamRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id).await?;

        try_join_all(
            teams
                .into_iter()
                .map(|team| self.assemble_team(team, &event)),
        )
        .await
    }

    pub async fn get_team(&self, team_id: Uuid) -> ServiceResult<Team> {
        let (team, event) =
            TeamRepository::fetch_by_id_with_event(self.db_repo.conn(), team_id).await?;

        self.assemble_team(team, &event).await
    }

    pub async fn get_team_by_slug(&self, event_slug: &str, team_slug: &str) -> ServiceResult<Team> {
        let (team, event) =
            TeamRepository::fetch_by_slug_with_event(self.db_repo.conn(), event_slug, team_slug)
                .await?;

        self.assemble_team(team, &event).await
    }

    pub async fn update_team(&self, team_id: Uuid, team_fu: TeamForUpdate) -> ServiceResult<Team> {
        let txn = self.db_repo.conn().begin().await?;

        let (team, event) = TeamRepository::fetch_by_id_with_event(&txn, team_id).await?;

        let mut active_team = team.into_active_model();

        if let Some(name) = &team_fu.name {
            // Generate slug and check for naming conflicts
            let slug = self
                .generate_slug(&txn, event.id, name, Some(team_id))
                .await?;

            active_team.name = Set(name.clone());
            active_team.slug = Set(slug);
        }

        if let Some(project_id) = &team_fu.project_id {
            if project_id.is_nil() {
                active_team.project_id = Set(None);
            } else {
                active_team.project_id = Set(Some(*project_id));
            }
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

        if let Some(password) = &team_fu.password {
            if password.is_empty() {
                active_team.password = Set(None);
            } else {
                active_team.password = Set(Some(self.crypto_service.encrypt(&password.clone())?));
            }
        }

        if let Some(ai_api_key) = &team_fu.ai_api_key {
            if ai_api_key.is_empty() {
                active_team.ai_api_key = Set(None);
            } else {
                active_team.ai_api_key =
                    Set(Some(self.crypto_service.encrypt(&ai_api_key.clone())?));
            }
        }

        if let Some(comment) = &team_fu.comment {
            if comment.is_empty() {
                active_team.comment = Set(None);
            } else {
                active_team.comment = Set(Some(comment.clone()));
            }
        }

        if let Some(extra_score) = &team_fu.extra_score {
            active_team.extra_score = Set(Some(*extra_score));
        }

        if let Some(managed_address_override) = &team_fu.managed_address_override {
            if managed_address_override.is_empty() {
                active_team.managed_address_override = Set(None);
            } else {
                active_team.managed_address_override = Set(Some(managed_address_override.clone()));
            }
        }

        if let Some(direct_address_override) = &team_fu.direct_address_override {
            if direct_address_override.is_empty() {
                active_team.direct_address_override = Set(None);
            } else {
                active_team.direct_address_override = Set(Some(direct_address_override.clone()));
            }
        }

        if let Some(private_address_override) = &team_fu.private_address_override {
            if private_address_override.is_empty() {
                active_team.private_address_override = Set(None);
            } else {
                active_team.private_address_override = Set(Some(private_address_override.clone()));
            }
        }

        if let Some(ssh_config_override) = &team_fu.ssh_config_override {
            if ssh_config_override.is_empty() {
                active_team.ssh_config_override = Set(None);
            } else {
                active_team.ssh_config_override = Set(Some(ssh_config_override.clone()));
            }
        }

        if let Some(ingress_enabled) = &team_fu.ingress_enabled {
            active_team.ingress_enabled = Set(*ingress_enabled);
        }

        if let Some(ingress_config) = &team_fu.ingress_config {
            active_team.ingress_config = Set(serde_json::to_value(ingress_config)?);
        }

        if let Some(finalist) = &team_fu.finalist {
            active_team.finalist = Set(*finalist);
        }

        let team = active_team.update(&txn).await?;

        txn.commit().await?;

        self.assemble_team(team, &event).await
    }

    pub async fn get_finalists(&self, event_id: Uuid) -> ServiceResult<Vec<Uuid>> {
        let teams = TeamRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id).await?;

        let finalists = teams
            .into_iter()
            .filter(|t| t.finalist)
            .map(|t| t.id)
            .collect();
        Ok(finalists)
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
    pub async fn index_teams(&self, event_id: Uuid) -> ServiceResult<()> {
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

        Ok(())
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

    async fn assemble_team(
        &self,
        team_model: db_team::Model,
        event_model: &db_event::Model,
    ) -> ServiceResult<Team> {
        let photo_url = if let Some(photo_id) = team_model.photo_id {
            Some(self.upload_service.generate_download_url(photo_id).await?)
        } else {
            None
        };

        let managed_address = apply_override_and_template(
            team_model.managed_address_override.as_deref(),
            event_model.managed_address_template.as_deref(),
            &team_model,
        );

        let direct_address = apply_override_and_template(
            team_model.direct_address_override.as_deref(),
            event_model.direct_address_template.as_deref(),
            &team_model,
        );

        let private_address = apply_override_and_template(
            team_model.private_address_override.as_deref(),
            event_model.private_address_template.as_deref(),
            &team_model,
        );

        let ssh_config = apply_override_and_template(
            team_model.ssh_config_override.as_deref(),
            event_model.ssh_config_template.as_deref(),
            &team_model,
        );

        let ingress_config = serde_json::from_value::<IngressConfig>(team_model.ingress_config)?;

        let ingress_url = if team_model.ingress_enabled {
            ingress_config.assemble_url(managed_address.as_deref(), direct_address.as_deref())
        } else {
            None
        };
        let password = team_model
            .password
            .as_ref()
            .map(|p| self.crypto_service.decrypt(p))
            .transpose()?;
        let ai_api_key = team_model
            .ai_api_key
            .as_ref()
            .map(|k| self.crypto_service.decrypt(k))
            .transpose()?;

        let team = Team {
            id: team_model.id,
            event_id: team_model.event_id,
            project_id: team_model.project_id,
            name: team_model.name,
            slug: team_model.slug,
            index: team_model.index,
            photo_id: team_model.photo_id,
            photo_url,
            password,
            ai_api_key,
            extra_score: team_model.extra_score,
            comment: team_model.comment,
            managed_address,
            managed_address_override: team_model.managed_address_override,
            direct_address,
            direct_address_override: team_model.direct_address_override,
            private_address,
            private_address_override: team_model.private_address_override,
            ssh_config,
            ssh_config_override: team_model.ssh_config_override,
            ingress_enabled: team_model.ingress_enabled,
            ingress_config,
            ingress_url,
            finalist: team_model.finalist,
        };

        Ok(team)
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

    pub async fn create_team_ai_api_key(
        &self,
        team_id: Uuid,
        budget: f64,
        event_id: Uuid,
    ) -> ServiceResult<String> {
        let event: db_event::Model =
            EventRepository::fetch_by_id(self.db_repo.conn(), event_id).await?;
        let team = TeamRepository::fetch_by_id(self.db_repo.conn(), team_id).await?;

        let master_api_key = event
            .master_ai_api_key
            .ok_or(ServiceError::MissingMasterAIAPIKey)?;

        let api_key = self.crypto_service.decrypt(&master_api_key)?;

        let generated_key = self
            .lite_llm_repo
            .generate_team_key(team.index, budget, &api_key)
            .await
            .map_err(ServiceError::Repository)?;

        let mut active_team = team.into_active_model();
        let enc_key = self.crypto_service.encrypt(&generated_key)?;
        active_team.ai_api_key = Set(Some(enc_key));

        active_team.update(self.db_repo.conn()).await?;

        Ok(generated_key)
    }
}

fn apply_template(template: &str, team: &db_team::Model) -> String {
    // TODO: More robust/efficient templating

    template
        .replace("{team_id}", &team.id.to_string())
        .replace("{team_name}", &team.name)
        .replace("{team_slug}", &team.slug)
        .replace("{team_index}", &team.index.to_string())
        .replace("{team_index_padded}", &format!("{:02}", team.index))
}

fn apply_override_and_template(
    override_value: Option<&str>,
    template: Option<&str>,
    team: &db_team::Model,
) -> Option<String> {
    match (override_value, template) {
        (Some(overridden), _) => Some(overridden.to_string()),
        (None, Some(template)) => Some(apply_template(template, team)),
        (None, None) => None,
    }
}
