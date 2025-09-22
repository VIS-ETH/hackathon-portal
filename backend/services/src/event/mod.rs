pub mod models;

use crate::authorization::AuthorizationService;
use crate::event::models::{Event, EventForCreate, EventForUpdate};
use crate::rating::RatingService;
use crate::sidequest::SidequestService;
use crate::user::models::{ReducedUser, UserForCreate};
use crate::user::UserService;
use crate::ServiceResult;
use hackathon_portal_repositories::db::prelude::{db_event, EventPhase, EventRole};
use hackathon_portal_repositories::db::sea_orm_active_enums::EventVisibility;
use hackathon_portal_repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, Set};
use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

#[derive(Clone)]
pub struct EventService {
    authorization_service: Arc<AuthorizationService>,
    user_service: Arc<UserService>,
    sidequest_service: Arc<SidequestService>,
    rating_service: Arc<RatingService>,
    db_repo: DbRepository,
}

impl EventService {
    #[must_use]
    pub fn new(
        authorization_service: Arc<AuthorizationService>,
        user_service: Arc<UserService>,
        sidequest_service: Arc<SidequestService>,
        rating_service: Arc<RatingService>,
        db_repo: DbRepository,
    ) -> Self {
        Self {
            authorization_service,
            user_service,
            sidequest_service,
            rating_service,
            db_repo,
        }
    }

    pub async fn create_event(
        &self,
        creator: Uuid,
        event_fc: EventForCreate,
    ) -> ServiceResult<Event> {
        // Generate slug and check for naming conflicts
        let slug = self
            .db_repo
            .generate_slug(&event_fc.name, None, db_event::Entity)
            .await?;

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
            .exec_with_returning(self.db_repo.conn())
            .await?;

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
        let events = self.db_repo.get_events().await?;
        let events = events.into_iter().map(Event::from).collect();

        Ok(events)
    }

    pub async fn get_event(&self, event_id: Uuid) -> ServiceResult<Event> {
        let event = self.db_repo.get_event(event_id).await?;
        Ok(event.into())
    }

    pub async fn get_event_by_slug(&self, event_slug: &str) -> ServiceResult<Event> {
        let event = self.db_repo.get_event_by_slug(event_slug).await?;
        Ok(event.into())
    }

    pub async fn update_event(
        &self,
        event_id: Uuid,
        event_fu: EventForUpdate,
    ) -> ServiceResult<Event> {
        let event = self.db_repo.get_event(event_id).await?;
        let mut active_event = event.into_active_model();

        if let Some(name) = &event_fu.name {
            // Generate slug and check for naming conflicts
            let slug = self
                .db_repo
                .generate_slug(name, None, db_event::Entity)
                .await?;

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

        if let Some(phase) = event_fu.phase {
            active_event.phase = Set(phase);
        }

        let event = active_event.update(self.db_repo.conn()).await?;

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
        let teams = self.db_repo.get_teams(event_id).await?;
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
}
