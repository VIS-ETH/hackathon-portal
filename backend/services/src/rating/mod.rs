pub mod models;

use crate::rating::models::{
    AggregatedRating, ExpertRating, ExpertRatingForCreate, ExpertRatingForUpdate,
    ExpertRatingLeaderboardEntry,
};
use crate::ServiceResult;
use hackathon_portal_repositories::db::prelude::*;
use hackathon_portal_repositories::DbRepository;
use sea_orm::prelude::*;
use sea_orm::sea_query::Func;
use sea_orm::{
    ActiveModelTrait, FromQueryResult, IntoActiveModel, IntoSimpleExpr, QuerySelect, Set,
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
        #[derive(FromQueryResult)]
        pub struct AggregatedRatingx {
            team_id: Uuid,
            category: ExpertRatingCategory,
            rating_sum: f64,
            rating_count: i64,
        }

        let ratings = db_expert_rating::Entity::find()
            .select_only()
            .column(db_expert_rating::Column::TeamId)
            .column(db_expert_rating::Column::Category)
            .column_as(db_expert_rating::Column::Rating.sum(), "rating_sum")
            .column_as(db_expert_rating::Column::Rating.count(), "rating_count")
            .inner_join(db_team::Entity)
            .filter(db_team::Column::EventId.eq(event_id))
            .group_by(db_expert_rating::Column::TeamId)
            .group_by(db_expert_rating::Column::Category)
            .into_model::<AggregatedRatingx>()
            .all(self.db_repo.conn())
            .await?;

        let teams =
            ratings
                .into_iter()
                .fold(HashMap::new(), |mut acc: HashMap<Uuid, Vec<_>>, rating| {
                    let team_ratings = acc.entry(rating.team_id).or_default();
                    team_ratings.push(rating);
                    acc
                });

        let mut leaderboard = teams
            .values()
            .map(|ratings| {
                let team_id = ratings[0].team_id;

                let (total_weight, total_rating) =
                    ratings.iter().fold((0.0, 0.0), |acc, rating| {
                        (
                            acc.0 + rating.category.get_weight(),
                            acc.1
                                + (rating.rating_sum / rating.rating_count as f64)
                                    * rating.category.get_weight(),
                        )
                    });

                let rating = total_rating / total_weight;

                let categories = ratings.iter().fold(HashMap::new(), |mut acc, rating| {
                    acc.insert(
                        rating.category,
                        rating.rating_sum / rating.rating_count as f64,
                    );
                    acc
                });

                ExpertRatingLeaderboardEntry {
                    team_id,
                    rating,
                    categories,
                }
            })
            .collect::<Vec<_>>();

        leaderboard.sort_by(|a, b| b.rating.partial_cmp(&a.rating).unwrap_or(Ordering::Equal));

        Ok(leaderboard)
    }
}
