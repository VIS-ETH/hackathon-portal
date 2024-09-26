pub mod model;

use crate::event::model::{EventForCreate, EventForPatch};
use crate::{ServiceError, ServiceResult};
use rand::distributions::Alphanumeric;
use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};
use repositories::db::prelude::{db_event, EventPhase};
use repositories::db::sea_orm_active_enums::EventVisibility;
use repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, Condition, IntoActiveModel, QueryOrder, Set};
use slug::slugify;

#[derive(Clone)]
pub struct EventService {
    db_repo: DbRepository,
}

impl EventService {
    pub fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn create_event(&self, req: EventForCreate) -> ServiceResult<db_event::Model> {
        self.check_event_name_conflict(&req.name).await?;

        let slug = slugify(&req.name);
        let kdf_secret = self.generate_kdf_secret();

        let active_event = db_event::ActiveModel {
            name: Set(req.name),
            slug: Set(slug),
            start: Set(req.start),
            end: Set(req.end),
            max_team_size: Set(req.max_team_size as i32),
            kdf_secret: Set(kdf_secret),
            is_feedback_visible: Set(false),
            visibility: Set(EventVisibility::Private),
            phase: Set(EventPhase::Registration),
            ..Default::default()
        };

        let event = db_event::Entity::insert(active_event)
            .exec_with_returning(self.db_repo.conn())
            .await?;

        Ok(event)
    }

    pub async fn get_events(&self) -> ServiceResult<Vec<db_event::Model>> {
        let events = db_event::Entity::find()
            .order_by_asc(db_event::Column::Start)
            .all(self.db_repo.conn())
            .await?;

        Ok(events)
    }

    pub async fn get_event(&self, event_id: Uuid) -> ServiceResult<db_event::Model> {
        let event = db_event::Entity::find()
            .filter(db_event::Column::Id.eq(event_id))
            .one(self.db_repo.conn())
            .await?
            .ok_or_else(|| ServiceError::ResourceNotFound {
                resource: "Event".to_string(),
                id: event_id.to_string(),
            })?;

        Ok(event)
    }

    pub async fn patch_event(
        &self,
        event_id: Uuid,
        patch: &EventForPatch,
    ) -> ServiceResult<db_event::Model> {
        let event = db_event::Entity::find()
            .filter(db_event::Column::Id.eq(event_id))
            .one(self.db_repo.conn())
            .await?
            .ok_or_else(|| ServiceError::ResourceNotFound {
                resource: "Event".to_string(),
                id: event_id.to_string(),
            })?;

        let mut active_event = event.into_active_model();

        if let Some(name) = &patch.name {
            self.check_event_name_conflict(name).await?;
            active_event.name = Set(name.clone());
            active_event.slug = Set(slugify(name));
        }

        if let Some(start) = patch.start {
            active_event.start = Set(start);
        }

        if let Some(end) = patch.end {
            active_event.end = Set(end);
        }

        if let Some(max_team_size) = patch.max_team_size {
            active_event.max_team_size = Set(max_team_size as i32);
        }

        if let Some(is_feedback_visible) = patch.is_feedback_visible {
            active_event.is_feedback_visible = Set(is_feedback_visible);
        }

        if let Some(visibility) = &patch.visibility {
            active_event.visibility = Set(visibility.clone());
        }

        if let Some(phase) = &patch.phase {
            active_event.phase = Set(phase.clone());
        }

        let event = active_event.update(self.db_repo.conn()).await?;

        Ok(event)
    }

    fn generate_kdf_secret(&self) -> String {
        let rng = StdRng::from_entropy();
        rng.sample_iter(&Alphanumeric)
            .take(32)
            .map(char::from)
            .collect::<String>()
    }

    async fn check_event_name_conflict(&self, name: &str) -> ServiceResult<()> {
        let slug = slugify(name);

        let existing = db_event::Entity::find()
            .filter(
                Condition::any()
                    .add(db_event::Column::Name.eq(name))
                    .add(db_event::Column::Slug.eq(&slug)),
            )
            .one(self.db_repo.conn())
            .await?;

        if let Some(existing) = existing {
            return if existing.slug == slug {
                Err(ServiceError::SlugNotUnique { slug })
            } else {
                Err(ServiceError::NameNotUnique {
                    name: name.to_string(),
                })
            };
        }

        Ok(())
    }
}
