pub mod models;

use crate::rating::models::{
    AggregatedRating, ExpertRating, ExpertRatingForCreate, ExpertRatingForUpdate,
    ExpertRatingLeaderboardEntry,
};
use crate::ServiceResult;
use itertools::Itertools;
use repositories::db::prelude::*;
use repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::sea_query::Func;
use sea_orm::{
    ActiveModelTrait, IntoActiveModel, IntoSimpleExpr, QuerySelect, Set,
};
use std::cmp::Ordering;
use std::collections::HashMap;

#[derive(Clone)]
pub struct RatingService {
    db_repo: DbRepository,
}

impl RatingService {
    #[must_use]
    pub const fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    pub async fn create_expert_rating(
        &self,
        creator_id: Uuid,
        appointment_fc: ExpertRatingForCreate,
    ) -> ServiceResult<ExpertRating> {
        let active_rating = db_expert_rating::ActiveModel {
            user_id: Set(creator_id),
            team_id: Set(appointment_fc.team_id),
            category: Set(appointment_fc.category),
            rating: Set(appointment_fc.rating),
            ..Default::default()
        };

        let rating = active_rating.insert(self.db_repo.conn()).await?;

        Ok(rating.into())
    }

    pub async fn get_expert_ratings(&self, team_id: Uuid) -> ServiceResult<Vec<ExpertRating>> {
        let ratings = self.db_repo.get_expert_ratings(team_id).await?;
        let ratings = ratings.into_iter().map(ExpertRating::from).collect();

        Ok(ratings)
    }

    pub async fn get_expert_rating(&self, rating_id: Uuid) -> ServiceResult<ExpertRating> {
        let rating = self.db_repo.get_expert_rating(rating_id).await?;
        Ok(rating.into())
    }

    pub async fn update_expert_rating(
        &self,
        rating_id: Uuid,
        rating_fu: ExpertRatingForUpdate,
    ) -> ServiceResult<ExpertRating> {
        let rating = self.db_repo.get_expert_rating(rating_id).await?;
        let mut active_rating = rating.into_active_model();

        if let Some(rating) = rating_fu.rating {
            active_rating.rating = Set(rating);
        }

        let rating = active_rating.update(self.db_repo.conn()).await?;

        Ok(rating.into())
    }

    pub async fn delete_expert_rating(&self, rating_id: Uuid) -> ServiceResult<()> {
        let rating = self.db_repo.get_expert_rating(rating_id).await?;
        rating.delete(self.db_repo.conn()).await?;

        Ok(())
    }

    pub async fn aggregate_expert_ratings(
        &self,
        team_id: Uuid,
    ) -> ServiceResult<HashMap<ExpertRatingCategory, f64>> {
        let ratings = db_expert_rating::Entity::find()
            .select_only()
            .column(db_expert_rating::Column::TeamId)
            .column(db_expert_rating::Column::Category)
            .expr_as(
                Func::avg(db_expert_rating::Column::Rating.into_simple_expr()),
                "average",
            )
            .filter(db_expert_rating::Column::TeamId.eq(team_id))
            .group_by(db_expert_rating::Column::TeamId)
            .group_by(db_expert_rating::Column::Category)
            .into_model::<AggregatedRating>()
            .all(self.db_repo.conn())
            .await?;

        let category_ratings = ratings
            .into_iter()
            .map(|rating| (rating.category, rating.average))
            .collect::<HashMap<_, _>>();

        Ok(category_ratings)
    }

    pub async fn get_expert_leaderboard(
        &self,
        event_id: Uuid,
    ) -> ServiceResult<Vec<ExpertRatingLeaderboardEntry>> {
        let ratings = db_expert_rating::Entity::find()
            .select_only()
            .column(db_expert_rating::Column::TeamId)
            .column(db_expert_rating::Column::Category)
            .expr_as(
                Func::avg(db_expert_rating::Column::Rating.into_simple_expr()),
                "average",
            )
            .inner_join(db_team::Entity)
            .filter(db_team::Column::EventId.eq(event_id))
            .group_by(db_expert_rating::Column::TeamId)
            .group_by(db_expert_rating::Column::Category)
            .into_model::<AggregatedRating>()
            .all(self.db_repo.conn())
            .await?;

        let ratings_by_team = ratings
            .iter()
            .chunk_by(|rating| rating.team_id)
            .into_iter()
            .map(|(team_id, ratings)| (team_id, ratings.collect::<Vec<_>>()))
            .collect::<HashMap<_, _>>();

        let mut leaderboard = ratings_by_team
            .values()
            .map(|team_ratings| {
                let team_id = team_ratings[0].team_id;

                let weights_sum = team_ratings
                    .iter()
                    .map(|rating| rating.category.get_weight())
                    .sum::<f64>();

                let ratings_sum = team_ratings
                    .iter()
                    .map(|rating| rating.average * rating.category.get_weight())
                    .sum::<f64>();

                let overall_rating = ratings_sum / weights_sum;

                let category_ratings = team_ratings
                    .iter()
                    .map(|rating| (rating.category, rating.average))
                    .collect();

                ExpertRatingLeaderboardEntry {
                    team_id,
                    rating: overall_rating,
                    categories: category_ratings,
                }
            })
            .collect::<Vec<_>>();

        leaderboard.sort_by(|a, b| b.rating.partial_cmp(&a.rating).unwrap_or(Ordering::Equal));

        Ok(leaderboard)
    }
}
