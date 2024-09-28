pub mod model;

use crate::appointment::model::{Appointment, AppointmentForCreate, AppointmentForUpdate};
use crate::{ServiceError, ServiceResult};
use repositories::db::prelude::*;
use repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, QueryOrder, Set};

#[derive(Clone)]
pub struct AppointmentService {
    db_repo: DbRepository,
}

impl AppointmentService {
    pub fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn create_appointment(
        &self,
        appointment_fc: AppointmentForCreate,
    ) -> ServiceResult<Appointment> {
        let active_appointment = db_appointment::ActiveModel {
            event_id: Set(appointment_fc.event_id),
            title: Set(appointment_fc.title),
            description: Set(appointment_fc.description),
            content: Set(appointment_fc.content),
            start: Set(appointment_fc.start),
            end: Set(appointment_fc.end),
            ..Default::default()
        };

        let appointment = active_appointment.insert(self.db_repo.conn()).await?;
        let appointment = Appointment::from(appointment);

        Ok(appointment)
    }

    pub async fn get_appointments(&self, event_id: Uuid) -> ServiceResult<Vec<Appointment>> {
        let appointments = db_appointment::Entity::find()
            .filter(db_appointment::Column::EventId.eq(event_id))
            .order_by_asc(db_appointment::Column::Start)
            .all(self.db_repo.conn())
            .await?;

        let appointments = appointments.into_iter().map(Appointment::from).collect();

        Ok(appointments)
    }

    pub async fn get_appointment(&self, appointment_id: Uuid) -> ServiceResult<Appointment> {
        let appointment = self.get_db_appointment(appointment_id).await?;
        let appointment = Appointment::from(appointment);

        Ok(appointment)
    }

    pub async fn update_appointment(
        &self,
        appointment_id: Uuid,
        appointment_fu: AppointmentForUpdate,
    ) -> ServiceResult<Appointment> {
        let mut active_appointment = self
            .get_db_appointment(appointment_id)
            .await?
            .into_active_model();

        if let Some(title) = appointment_fu.title {
            active_appointment.title = Set(title);
        }

        if let Some(description) = appointment_fu.description {
            if description.is_empty() {
                active_appointment.description = Set(None);
            } else {
                active_appointment.description = Set(Some(description));
            }
        }

        if let Some(content) = appointment_fu.content {
            if content.is_empty() {
                active_appointment.content = Set(None);
            } else {
                active_appointment.content = Set(Some(content));
            }
        }

        if let Some(start) = appointment_fu.start {
            active_appointment.start = Set(start);
        }

        if let Some(end) = appointment_fu.end {
            if end.timestamp() == 0 {
                active_appointment.end = Set(None);
            } else {
                active_appointment.end = Set(Some(end));
            }
        }

        let appointment = active_appointment.update(self.db_repo.conn()).await?;
        let appointment = Appointment::from(appointment);

        Ok(appointment)
    }

    pub async fn delete_appointment(&self, appointment_id: Uuid) -> ServiceResult<()> {
        let appointment = self.get_db_appointment(appointment_id).await?;

        appointment.delete(self.db_repo.conn()).await?;

        Ok(())
    }

    async fn get_db_appointment(
        &self,
        appointment_id: Uuid,
    ) -> ServiceResult<db_appointment::Model> {
        let appointment = db_appointment::Entity::find()
            .filter(db_appointment::Column::Id.eq(appointment_id))
            .one(self.db_repo.conn())
            .await?
            .ok_or_else(|| ServiceError::ResourceNotFound {
                resource: "Appointment".to_string(),
                id: appointment_id.to_string(),
            })?;

        Ok(appointment)
    }
}
