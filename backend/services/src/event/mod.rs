pub mod models;

use crate::authorization::AuthorizationService;
use crate::crypto::CryptoService;
use crate::event::models::{Event, EventForCreate, EventForUpdate};
use crate::rating::RatingService;
use crate::sidequest::SidequestService;
use crate::user::models::{ReducedUser, UserForCreate};
use crate::user::UserService;
use crate::{ServiceError, ServiceResult};
use hackathon_portal_repositories::db::{
    db_event, EventPhase, EventRepository, EventRole, EventVisibility, TeamRepository,
};
use hackathon_portal_repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, Set, TransactionTrait};
use slug::slugify;
use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

#[derive(Clone)]
pub struct EventService {
    authorization_service: Arc<AuthorizationService>,
    user_service: Arc<UserService>,
    sidequest_service: Arc<SidequestService>,
    rating_service: Arc<RatingService>,
    crypto_service: Arc<CryptoService>,
    db_repo: DbRepository,
}

impl EventService {
    #[must_use]
    pub fn new(
        authorization_service: Arc<AuthorizationService>,
        user_service: Arc<UserService>,
        sidequest_service: Arc<SidequestService>,
        rating_service: Arc<RatingService>,
        crypto_service: Arc<CryptoService>,
        db_repo: DbRepository,
    ) -> Self {
        Self {
            authorization_service,
            user_service,
            sidequest_service,
            rating_service,
            crypto_service,
            db_repo,
        }
    }

    pub async fn create_event(
        &self,
        creator: Uuid,
        event_fc: EventForCreate,
    ) -> ServiceResult<Event> {
        let txn = self.db_repo.conn().begin().await?;

        let slug = self.generate_slug(&txn, &event_fc.name, None).await?;

        let active_event = db_event::ActiveModel {
            name: Set(event_fc.name),
            slug: Set(slug),
            start: Set(event_fc.start),
            end: Set(event_fc.end),
            max_team_size: Set(event_fc.max_team_size as i32),
            sidequest_cooldown: Set(event_fc.sidequest_cooldown as i32),
            read_only: Set(false),
            feedback_visible: Set(false),
            visibility: Set(EventVisibility::Hidden),
            phase: Set(EventPhase::Registration),
            ..Default::default()
        };

        let event = db_event::Entity::insert(active_event)
            .exec_with_returning(&txn)
            .await?;

        txn.commit().await?;

        // Assign creator as event admin
        self.authorization_service
            .assign_event_roles(
                event.id,
                HashMap::from([(creator, HashSet::from([EventRole::Admin]))]),
            )
            .await?;

        Ok(event.into())
    }

    pub async fn get_events(&self) -> ServiceResult<Vec<Event>> {
        let events = EventRepository::fetch_all(self.db_repo.conn()).await?;
        let events = events.into_iter().map(Event::from).collect();

        Ok(events)
    }

    pub async fn get_event(&self, event_id: Uuid) -> ServiceResult<Event> {
        let event = EventRepository::fetch_by_id(self.db_repo.conn(), event_id).await?;
        Ok(event.into())
    }

    pub async fn get_event_by_slug(&self, event_slug: &str) -> ServiceResult<Event> {
        let event = EventRepository::fetch_by_slug(self.db_repo.conn(), event_slug).await?;
        Ok(event.into())
    }

    pub async fn update_event(
        &self,
        event_id: Uuid,
        event_fu: EventForUpdate,
    ) -> ServiceResult<Event> {
        let txn = self.db_repo.conn().begin().await?;

        let event = EventRepository::fetch_by_id(&txn, event_id).await?;
        let mut active_event = event.into_active_model();

        if let Some(name) = &event_fu.name {
            let slug = self.generate_slug(&txn, name, Some(event_id)).await?;

            active_event.name = Set(name.clone());
            active_event.slug = Set(slug);
        }

        if let Some(start) = event_fu.start {
            active_event.start = Set(start);
        }

        if let Some(end) = event_fu.end {
            active_event.end = Set(end);
        }

        if let Some(welcome_content) = event_fu.welcome_content {
            if !welcome_content.is_empty() {
                active_event.welcome_content = Set(Some(welcome_content));
            }
        }

        if let Some(documentation_content) = event_fu.documentation_content {
            if !documentation_content.is_empty() {
                active_event.documentation_content = Set(Some(documentation_content));
            }
        }

        if let Some(max_team_size) = event_fu.max_team_size {
            active_event.max_team_size = Set(max_team_size as i32);
        }

        if let Some(max_teams_per_project) = event_fu.max_teams_per_project {
            active_event.max_teams_per_project = Set(max_teams_per_project as i32);
        }

        if let Some(sidequest_cooldown) = event_fu.sidequest_cooldown {
            active_event.sidequest_cooldown = Set(sidequest_cooldown as i32);
        }

        if let Some(managed_address_template) = event_fu.managed_address_template {
            if managed_address_template.is_empty() {
                active_event.managed_address_template = Set(None);
            } else {
                active_event.managed_address_template = Set(Some(managed_address_template));
            }
        }

        if let Some(direct_address_template) = event_fu.direct_address_template {
            if direct_address_template.is_empty() {
                active_event.direct_address_template = Set(None);
            } else {
                active_event.direct_address_template = Set(Some(direct_address_template));
            }
        }

        if let Some(private_address_template) = event_fu.private_address_template {
            if private_address_template.is_empty() {
                active_event.private_address_template = Set(None);
            } else {
                active_event.private_address_template = Set(Some(private_address_template));
            }
        }

        if let Some(ssh_config_template) = event_fu.ssh_config_template {
            if ssh_config_template.is_empty() {
                active_event.ssh_config_template = Set(None);
            } else {
                active_event.ssh_config_template = Set(Some(ssh_config_template));
            }
        }

        if let Some(read_only) = event_fu.read_only {
            active_event.read_only = Set(read_only);
        }

        if let Some(projects_visible) = event_fu.projects_visible {
            active_event.projects_visible = Set(projects_visible);
        }

        if let Some(project_assignments_visible) = event_fu.project_assignments_visible {
            active_event.project_assignments_visible = Set(project_assignments_visible);
        }

        if let Some(feedback_visible) = event_fu.feedback_visible {
            active_event.feedback_visible = Set(feedback_visible);
        }

        if let Some(visibility) = event_fu.visibility {
            active_event.visibility = Set(visibility);
        }

        if let Some(voting_enabled) = event_fu.vote_enabled {
            active_event.voting_open = Set(voting_enabled);
        }

        if let Some(finalists_visible) = event_fu.finalists_visible {
            active_event.finalists_visible = Set(finalists_visible);
        }

        if let Some(phase) = event_fu.phase {
            active_event.phase = Set(phase);
        }

        if let Some(master_ai_api_key) = event_fu.master_ai_api_key {
            let enc_key = self.crypto_service.encrypt(&master_ai_api_key)?;
            active_event.master_ai_api_key = Set(Some(enc_key));
        }

        if let Some(discord_server_id) = event_fu.discord_server_id {
            if !discord_server_id.is_empty() {
                active_event.discord_server_id = Set(Some(discord_server_id));
            }
        }

        if let Some(discord_config) = event_fu.discord_config {
            if !discord_config.is_empty() {
                active_event.discord_config = Set(Some(discord_config));
            }
        }

        let event = active_event.update(&txn).await?;

        txn.commit().await?;

        Ok(event.into())
    }

    pub async fn invite_users(
        &self,
        event_id: Uuid,
        users: Vec<UserForCreate>,
        roles: HashSet<EventRole>,
    ) -> ServiceResult<Vec<ReducedUser>> {
        // Ensure event exists
        self.get_event(event_id).await?;

        let new_users = self
            .user_service
            .create_users(users)
            .await?
            .into_iter()
            .map(ReducedUser::from)
            .collect::<Vec<_>>();

        let roles = new_users
            .iter()
            .map(|user| (user.id, roles.clone()))
            .collect::<HashMap<_, _>>();

        self.authorization_service
            .assign_event_roles(event_id, roles)
            .await?;

        Ok(new_users)
    }

    pub async fn get_leaderboard(&self, event_id: Uuid) -> ServiceResult<Vec<Uuid>> {
        let teams = TeamRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id).await?;
        let expert_leaderboard = self.rating_service.get_expert_leaderboard(event_id).await?;
        let sidequest_leaderboard = self.sidequest_service.get_leaderboard(event_id).await?;

        // Add bonus points
        let mut sidequest_leaderboard = sidequest_leaderboard
            .into_iter()
            .map(|mut team| {
                let extra_score = teams
                    .iter()
                    .find(|t| t.id == team.team_id)
                    .and_then(|t| t.extra_score);

                if let Some(extra_score) = extra_score {
                    team.score += extra_score;
                }

                team
            })
            .collect::<Vec<_>>();

        sidequest_leaderboard
            .sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(Ordering::Equal));

        let mut seen = HashSet::new();
        let mut merged = Vec::new();

        for team in expert_leaderboard.into_iter().take(3) {
            seen.insert(team.team_id);
            merged.push(team.team_id);
        }

        for team in sidequest_leaderboard {
            if seen.contains(&team.team_id) {
                continue;
            }

            seen.insert(team.team_id);
            merged.push(team.team_id);
        }

        Ok(merged)
    }

    async fn generate_slug<C: ConnectionTrait>(
        &self,
        db: &C,
        name: &str,
        current_event_id: Option<Uuid>,
    ) -> ServiceResult<String> {
        let slug = slugify(name);

        let conflicting =
            EventRepository::count_conflicting_by_slug(db, &slug, current_event_id).await?;

        if conflicting != 0 {
            return Err(ServiceError::SlugNotUnique { slug });
        }

        Ok(slug)
    }
}
