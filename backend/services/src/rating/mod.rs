pub mod models;
use crate::rating::models::{
    AggregatedRating, CreateTechnicalQuestion, ExpertRating, ExpertRatingForCreate,
    ExpertRatingForUpdate, ExpertRatingLeaderboardEntry, ExpertScore, PublicVote,
    PublicVoteAggregated, ScoreNormalized, SidequestScore, TechnicalQuestion,
    TechnicalQuestionResult, TechnicalScore, UpdateTechnicalQuestion, Vote, VotingScore,
};
use crate::sidequest::SidequestService;
use crate::team::TeamService;
use crate::ServiceError;
use crate::ServiceResult;
use futures::future::join_all;
use hackathon_portal_repositories::db::{
    db_expert_rating, db_team, db_technical_question, db_technical_rating, db_vote,
    ExpertRatingCategory, ExpertRatingRepository, TeamRepository, TechnicalQuestionRepository,
    VoteRepository,
};
use hackathon_portal_repositories::DbRepository;
use itertools::Itertools;
use sea_orm::sea_query::Func;
use sea_orm::TransactionTrait;
use sea_orm::{prelude::*, DeleteResult};
use sea_orm::{
    ActiveModelTrait, FromQueryResult, IntoActiveModel, IntoSimpleExpr, QuerySelect, Set,
};
use std::cmp::Ordering;
use std::collections::HashMap;
use std::sync::Arc;

#[derive(Clone)]
pub struct RatingService {
    db_repo: DbRepository,
    sidequest_service: Arc<SidequestService>,
    team_service: Arc<TeamService>,
}

impl RatingService {
    #[must_use]
    pub const fn new(
        db_repo: DbRepository,
        sidequest_service: Arc<SidequestService>,
        team_service: Arc<TeamService>,
    ) -> Self {
        Self {
            db_repo,
            sidequest_service,
            team_service,
        }
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
        let ratings =
            ExpertRatingRepository::fetch_all_by_team_id(self.db_repo.conn(), team_id).await?;

        let ratings = ratings.into_iter().map(ExpertRating::from).collect();

        Ok(ratings)
    }

    pub async fn get_expert_rating(&self, rating_id: Uuid) -> ServiceResult<ExpertRating> {
        let rating = ExpertRatingRepository::fetch_by_id(self.db_repo.conn(), rating_id).await?;
        Ok(rating.into())
    }

    pub async fn update_expert_rating(
        &self,
        rating_id: Uuid,
        rating_fu: ExpertRatingForUpdate,
    ) -> ServiceResult<ExpertRating> {
        let rating = ExpertRatingRepository::fetch_by_id(self.db_repo.conn(), rating_id).await?;

        let mut active_rating = rating.into_active_model();

        if let Some(rating) = rating_fu.rating {
            active_rating.rating = Set(rating);
        }

        let rating = active_rating.update(self.db_repo.conn()).await?;

        Ok(rating.into())
    }

    pub async fn delete_expert_rating(&self, rating_id: Uuid) -> ServiceResult<()> {
        let rating = ExpertRatingRepository::fetch_by_id(self.db_repo.conn(), rating_id).await?;

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
                            acc.0 + self.get_expert_rating_category_weight(rating.category),
                            acc.1
                                + (rating.rating_sum / rating.rating_count as f64)
                                    * self.get_expert_rating_category_weight(rating.category),
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

    #[must_use]
    pub fn get_expert_rating_category_weight(&self, category: ExpertRatingCategory) -> f64 {
        match category {
            ExpertRatingCategory::Product => 0.7,
            ExpertRatingCategory::Presentation => 0.3,
        }
    }

    pub async fn get_technical_questions(
        &self,
        event_id: Uuid,
    ) -> ServiceResult<Vec<TechnicalQuestion>> {
        let questions =
            TechnicalQuestionRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id)
                .await?;
        let questions = questions.into_iter().map(TechnicalQuestion::from).collect();

        Ok(questions)
    }

    pub async fn get_technical_question(
        &self,
        question_id: Uuid,
    ) -> ServiceResult<TechnicalQuestion> {
        let question =
            TechnicalQuestionRepository::fetch_by_id(self.db_repo.conn(), question_id).await?;
        Ok(question.into())
    }

    pub async fn create_technical_question(
        &self,
        question_fc: CreateTechnicalQuestion,
    ) -> ServiceResult<TechnicalQuestion> {
        let active_question = db_technical_question::ActiveModel {
            event_id: Set(question_fc.event_id),
            question: Set(question_fc.question),
            description: Set(question_fc.description),
            min_points: Set(question_fc.min_points),
            max_points: Set(question_fc.max_points),
            binary: Set(question_fc.binary),
            ..Default::default()
        };

        let question = active_question.insert(self.db_repo.conn()).await?;

        Ok(question.into())
    }

    pub async fn delete_technical_question(
        &self,
        question_id: Uuid,
    ) -> ServiceResult<DeleteResult> {
        let trx = self.db_repo.conn().begin().await?;
        let question = TechnicalQuestionRepository::fetch_by_id(&trx, question_id).await?;
        let affected_rows = question.delete(&trx).await?;
        trx.commit().await?;
        Ok(affected_rows)
    }

    pub async fn update_technical_question(
        &self,
        update_question: UpdateTechnicalQuestion,
    ) -> ServiceResult<TechnicalQuestion> {
        let trx = self.db_repo.conn().begin().await?;
        let question = TechnicalQuestionRepository::fetch_by_id(&trx, update_question.id).await?;
        let mut active_question = question.into_active_model();

        if let Some(question) = update_question.question {
            active_question.question = Set(question);
        }
        if let Some(description) = update_question.description {
            active_question.description = Set(Some(description));
        }
        if let Some(min_points) = update_question.min_points {
            active_question.min_points = Set(min_points);
        }
        if let Some(max_points) = update_question.max_points {
            active_question.max_points = Set(max_points);
        }
        if let Some(binary) = update_question.binary {
            active_question.binary = Set(binary);
        }

        let question = active_question.update(&trx).await?;
        trx.commit().await?;

        Ok(question.into())
    }

    pub async fn get_technical_rating(
        &self,
        team_id: Uuid,
    ) -> ServiceResult<Vec<TechnicalQuestionResult>> {
        // TODO Improve this with join
        let event_id = TeamRepository::fetch_by_id(self.db_repo.conn(), team_id)
            .await?
            .event_id;

        let questions =
            TechnicalQuestionRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id)
                .await?;

        let mut ratings = Vec::new();
        for question in &questions {
            let answer = db_technical_rating::Entity::find()
                .filter(db_technical_rating::Column::TeamId.eq(team_id))
                .filter(db_technical_rating::Column::TechnicalQuestionId.eq(question.id))
                .all(self.db_repo.conn())
                .await?;
            if let Some(rating) = answer.first() {
                ratings.push(TechnicalQuestionResult {
                    question: question.clone().into(),
                    points: Some(rating.score),
                });
            } else {
                ratings.push(TechnicalQuestionResult {
                    question: question.clone().into(),
                    points: None,
                });
            }
        }

        Ok(ratings)
    }

    pub async fn set_technical_rating(
        &self,
        team_id: Uuid,
        question_id: Uuid,
        points: f64,
    ) -> ServiceResult<TechnicalQuestionResult> {
        let trx = self.db_repo.conn().begin().await?;
        let question = TechnicalQuestionRepository::fetch_by_id(&trx, question_id).await?;

        if (question.binary
            && !(points == f64::from(question.min_points)
                || points == f64::from(question.max_points)))
            || (!question.binary
                && (points < f64::from(question.min_points)
                    || points > f64::from(question.max_points)))
        {
            return Err(ServiceError::WrongTechnicalQuestionPoints {
                given_score: points,
                allowed_scores: format!(
                    "{} {} {}",
                    question.min_points,
                    if question.binary { "or" } else { "-" },
                    question.max_points
                ),
            });
        }

        let existing_rating = db_technical_rating::Entity::find()
            .filter(db_technical_rating::Column::TeamId.eq(team_id))
            .filter(db_technical_rating::Column::TechnicalQuestionId.eq(question_id))
            .one(self.db_repo.conn())
            .await?;

        let rating = if let Some(existing_rating) = existing_rating {
            let mut active_rating = existing_rating.into_active_model();
            active_rating.score = Set(points);
            active_rating.update(self.db_repo.conn()).await?
        } else {
            let active_rating = db_technical_rating::ActiveModel {
                team_id: Set(team_id),
                technical_question_id: Set(question_id),
                score: Set(points),
                ..Default::default()
            };
            active_rating.insert(self.db_repo.conn()).await?
        };

        Ok(TechnicalQuestionResult {
            question: question.into(),
            points: Some(rating.score),
        })
    }

    pub async fn set_public_vote(
        &self,
        user_id: Uuid,
        event_id: Uuid,
        vote: Vote,
    ) -> ServiceResult<db_vote::Model> {
        let trx = self.db_repo.conn().begin().await?;
        let votes = VoteRepository::fetch_votes_by_user_in_event(&trx, event_id, user_id).await?;
        let updated_vote = if let Some(existing_vote) = votes.iter().find(|v| v.rank == vote.place)
        {
            let mut active_vote = existing_vote.clone().into_active_model();
            active_vote.team_id = Set(vote.team_id);
            active_vote.update(&trx).await?
        } else {
            let active_vote = db_vote::ActiveModel {
                user_id: Set(user_id),
                team_id: Set(vote.team_id),
                rank: Set(vote.place),
                ..Default::default()
            };
            active_vote.insert(&trx).await?
        };
        trx.commit().await?;
        Ok(updated_vote)
    }

    pub async fn get_public_vote_by_user(
        &self,
        event_id: Uuid,
        user_id: Uuid,
    ) -> ServiceResult<Vec<PublicVote>> {
        let votes =
            VoteRepository::fetch_votes_by_user_in_event(self.db_repo.conn(), event_id, user_id)
                .await?;
        Ok(votes.into_iter().map(PublicVote::from).collect())
    }

    pub async fn get_public_votes_for_team(&self, team_id: Uuid) -> ServiceResult<Vec<PublicVote>> {
        let votes = VoteRepository::fetch_votes_for_team(self.db_repo.conn(), team_id).await?;
        Ok(votes.into_iter().map(PublicVote::from).collect())
    }

    pub async fn get_public_votes_for_team_aggregated(
        &self,
        team_id: Uuid,
    ) -> ServiceResult<PublicVoteAggregated> {
        let votes = VoteRepository::fetch_votes_for_team(self.db_repo.conn(), team_id).await?;
        let mut num_votes_per_rank = HashMap::new();
        for vote in votes {
            *num_votes_per_rank.entry(vote.rank).or_insert(0) += 1;
        }
        Ok(PublicVoteAggregated {
            team_id,
            num_votes_per_rank,
        })
    }

    #[must_use]
    pub fn get_public_rating_rank_score(&self, rank: i32) -> f64 {
        match rank {
            1 => 5.0,
            2 => 3.0,
            3 => 1.0,
            _ => 0.0,
        }
    }

    fn project_scores<T>(
        &self,
        scores: &HashMap<Uuid, T>,
        key: fn(&T) -> f64,
        upper_bound: f64,
    ) -> Option<HashMap<Uuid, f64>> {
        if scores.is_empty() {
            return Some(HashMap::new());
        }

        let max_score = scores
            .values()
            .map(|score| key(score))
            .max_by(|a, b| a.partial_cmp(b).unwrap_or(Ordering::Equal))?;

        if scores.iter().all(|(_, score)| key(score) == 0.0) {
            return scores
                .keys()
                .map(|team_id| (*team_id, 0.0))
                .collect::<HashMap<Uuid, f64>>()
                .into();
        }
        if max_score == 0.0 {
            return None;
        }
        Some(
            scores
                .iter()
                .map(|(team_id, score)| (*team_id, key(score) / max_score * upper_bound))
                .collect::<HashMap<Uuid, f64>>(),
        )
    }

    fn calculate_rank<T>(
        &self,
        scores: &HashMap<Uuid, T>,
        key: fn(&T) -> f64,
    ) -> HashMap<Uuid, i32> {
        let mut scores = scores
            .iter()
            .map(|(k, v)| (k, (key(v) * 10000.0) as i32))
            .collect::<Vec<(&Uuid, i32)>>();
        scores.sort_by(|(_, a), (_, b)| b.cmp(a));

        let mut rank = HashMap::<i32, i32>::new();
        for (i, (_, score)) in scores.iter().enumerate() {
            rank.entry(*score).or_insert((i + 1) as i32);
        }

        scores
            .into_iter()
            .map(|(team_id, s)| (*team_id, *rank.get(&s).expect("is inserted before")))
            .collect()
    }

    async fn get_sidequest_score(
        &self,
        event_id: Uuid,
    ) -> ServiceResult<HashMap<Uuid, Option<SidequestScore>>> {
        let scores = self.sidequest_service.aggregate_scores(event_id).await?;
        let scores_normalized = self.project_scores(&scores, |s| *s, 10.0).ok_or(
            ServiceError::ScoreCalculationError {
                message: "Failed to normalize sidequest scores".into(),
            },
        )?;
        let ranking = self.calculate_rank::<f64>(&scores_normalized, |s| *s);
        Ok(scores
            .into_iter()
            .map(|(team_id, score)| {
                match (scores_normalized.get(&team_id), ranking.get(&team_id)) {
                    (Some(score_normalized), Some(category_rank)) => (
                        team_id,
                        Some(SidequestScore {
                            score_normalized: *score_normalized,
                            category_rank: *category_rank,
                            score,
                        }),
                    ),
                    _ => (team_id, None),
                }
            })
            .collect::<HashMap<Uuid, _>>())
    }

    async fn get_expert_score(
        &self,
        event_id: Uuid,
    ) -> ServiceResult<HashMap<Uuid, Option<ExpertScore>>> {
        let teams = self.team_service.get_teams(event_id).await?;

        struct IntermediateScore {
            pub score: f64,
            pub presentation_score: f64,
            pub product_score: f64,
        }

        let intermediate_scores = join_all(teams.iter().map(async move |team| {
            match self.aggregate_expert_ratings(team.id).await {
                Ok(rating) => {
                    let final_score = rating.iter().fold(0.0, |agg, (category, score)| {
                        let weight = self.get_expert_rating_category_weight(*category);
                        agg + score * weight
                    });
                    (
                        team.id,
                        Ok(IntermediateScore {
                            score: final_score,
                            presentation_score: *rating
                                .get(&ExpertRatingCategory::Presentation)
                                .unwrap_or(&0.0),
                            product_score: *rating
                                .get(&ExpertRatingCategory::Product)
                                .unwrap_or(&0.0),
                        }),
                    )
                }
                Err(e) => (team.id, Err(e)),
            }
        }))
        .await
        .into_iter()
        .collect::<HashMap<Uuid, _>>();

        let intermediate_scores_filtered = intermediate_scores
            .into_iter()
            .filter_map(|(team_id, res)| {
                if let Ok(score) = res {
                    Some((team_id, score))
                } else {
                    None
                }
            })
            .collect::<HashMap<Uuid, _>>();

        let scores_normalized = self
            .project_scores::<IntermediateScore>(&intermediate_scores_filtered, |s| s.score, 30.0)
            .ok_or(ServiceError::ScoreCalculationError {
                message: "Failed to normalize expert scores".into(),
            })?;

        let ranking =
            self.calculate_rank::<IntermediateScore>(&intermediate_scores_filtered, |s| s.score);

        Ok(teams
            .iter()
            .map(|team| {
                match (
                    scores_normalized.get(&team.id),
                    ranking.get(&team.id),
                    intermediate_scores_filtered.get(&team.id),
                ) {
                    (Some(score_normalized), Some(category_rank), Some(intermediate_score)) => (
                        team.id,
                        Some(ExpertScore {
                            score_normalized: *score_normalized,
                            score: intermediate_score.score,
                            presentation_score: intermediate_score.presentation_score,
                            product_score: intermediate_score.product_score,
                            category_rank: *category_rank,
                        }),
                    ),
                    _ => (team.id, None),
                }
            })
            .collect::<HashMap<Uuid, _>>())
    }

    async fn get_technical_score(
        &self,
        event_id: Uuid,
    ) -> ServiceResult<HashMap<Uuid, Option<TechnicalScore>>> {
        let teams = self.team_service.get_teams(event_id).await?;

        struct IntermediateScore {
            pub score: f64,
            pub all_answered: bool,
        }
        let technical_score = join_all(teams.iter().map(async move |team| {
            let technical_rating = self.get_technical_rating(team.id).await;
            let intermediate_result = match technical_rating {
                Ok(technical_rating) => (
                    team.id,
                    Ok(technical_rating.iter().fold(
                        IntermediateScore {
                            score: 0.0,
                            all_answered: true,
                        },
                        |agg, res| match res.points {
                            None => IntermediateScore {
                                score: agg.score,
                                all_answered: false,
                            },
                            Some(points) => IntermediateScore {
                                score: agg.score + points,
                                all_answered: agg.all_answered,
                            },
                        },
                    )),
                ),
                Err(e) => (team.id, Err(e)),
            };
            intermediate_result
        }))
        .await;

        let technical_score_filtered = technical_score
            .into_iter()
            .filter_map(|(team_id, res)| {
                if let Ok(score) = res {
                    Some((team_id, score))
                } else {
                    None
                }
            })
            .collect::<HashMap<Uuid, _>>();

        let normalized_scores = self
            .project_scores::<IntermediateScore>(&technical_score_filtered, |s| s.score, 20.0)
            .ok_or(ServiceError::ScoreCalculationError {
                message: "Failed to normalize technical scores".into(),
            })?;

        let ranking = self.calculate_rank(&technical_score_filtered, |s| s.score);

        Ok(teams
            .iter()
            .map(|team| {
                match (
                    normalized_scores.get(&team.id),
                    ranking.get(&team.id),
                    technical_score_filtered.get(&team.id),
                ) {
                    (Some(score_normalized), Some(category_rank), Some(intermediate_score)) => (
                        team.id,
                        Some(TechnicalScore {
                            score_normalized: *score_normalized,
                            score: intermediate_score.score,
                            category_rank: *category_rank,
                            all_answered: intermediate_score.all_answered,
                        }),
                    ),
                    _ => (team.id, None),
                }
            })
            .collect::<HashMap<Uuid, _>>())
    }

    async fn get_public_score(
        &self,
        event_id: Uuid,
    ) -> ServiceResult<HashMap<Uuid, Option<VotingScore>>> {
        let teams = self.team_service.get_teams(event_id).await?;

        let scores = join_all(teams.iter().map(async move |team| {
            match self.get_public_votes_for_team_aggregated(team.id).await {
                Ok(votes) => {
                    let score = votes
                        .num_votes_per_rank
                        .iter()
                        .fold(0.0, |agg, (rank, count)| {
                            agg + self.get_public_rating_rank_score(*rank) * f64::from(*count)
                        });
                    (team.id, Ok((score, votes.num_votes_per_rank)))
                }
                Err(e) => (team.id, Err(e)),
            }
        }))
        .await
        .into_iter()
        .collect::<HashMap<Uuid, Result<_, _>>>();

        let scores_filtered = scores
            .into_iter()
            .filter_map(|(team_id, res)| {
                if let Ok(score) = res {
                    Some((team_id, score))
                } else {
                    None
                }
            })
            .collect::<HashMap<Uuid, _>>();

        let scores_normalized = self
            .project_scores::<(f64, HashMap<i32, i32>)>(&scores_filtered, |s| s.0, 30.0)
            .ok_or(ServiceError::ScoreCalculationError {
                message: "Failed to normalize sidequest scores".into(),
            })?;

        let ranking = self.calculate_rank::<(f64, HashMap<i32, i32>)>(&scores_filtered, |s| s.0);

        Ok(teams
            .iter()
            .map(|team| {
                match (
                    scores_filtered.get(&team.id),
                    scores_normalized.get(&team.id),
                    ranking.get(&team.id),
                ) {
                    (
                        Some((score, num_votes_per_rank)),
                        Some(score_normalized),
                        Some(category_rank),
                    ) => (
                        team.id,
                        Some(VotingScore {
                            score_normalized: *score_normalized,
                            score: *score,
                            category_rank: *category_rank,
                            votes: num_votes_per_rank.clone(),
                        }),
                    ),
                    _ => (team.id, None),
                }
            })
            .collect::<HashMap<Uuid, _>>())
    }

    pub async fn get_complete_scores(&self, event_id: Uuid) -> ServiceResult<Vec<ScoreNormalized>> {
        let teams = self.team_service.get_teams(event_id).await?;
        let technical_scores = self.get_technical_score(event_id).await?;
        let expert_scores = self.get_expert_score(event_id).await?;
        let sidequest_scores = self.get_sidequest_score(event_id).await?;
        let public_scores = self.get_public_score(event_id).await?;
        let bonus_scores = TeamRepository::fetch_all_by_event_id(self.db_repo.conn(), event_id)
            .await?
            .into_iter()
            .map(|team| (team.id, team.extra_score.unwrap_or(0.0)))
            .collect::<HashMap<Uuid, _>>();

        let final_score = teams
            .iter()
            .map(|team| {
                let tech_score = technical_scores
                    .get(&team.id)
                    .and_then(|s| s.as_ref())
                    .map_or(0.0, |s| s.score_normalized);
                let expert_score = expert_scores
                    .get(&team.id)
                    .and_then(|s| s.as_ref())
                    .map_or(0.0, |s| s.score_normalized);
                let sidequest_score = sidequest_scores
                    .get(&team.id)
                    .and_then(|s| s.as_ref())
                    .map_or(0.0, |s| s.score_normalized);
                let public_score = public_scores
                    .get(&team.id)
                    .and_then(|s| s.as_ref())
                    .map_or(0.0, |s| s.score_normalized);
                let bonus_score = bonus_scores.get(&team.id).copied().unwrap_or(0.0);
                (
                    team.id,
                    tech_score + expert_score + sidequest_score + public_score + bonus_score,
                )
            })
            .collect::<HashMap<Uuid, f64>>();

        let ranking = self.calculate_rank::<f64>(&final_score, |s| *s);
        let max_final_score = final_score
            .iter()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap_or(Ordering::Equal));

        Ok(teams
            .iter()
            .map(|team| ScoreNormalized {
                team_id: team.id,
                tech_score: technical_scores
                    .get(&team.id)
                    .and_then(std::clone::Clone::clone),
                expert_score: expert_scores
                    .get(&team.id)
                    .and_then(std::clone::Clone::clone),
                sidequest_score: sidequest_scores
                    .get(&team.id)
                    .and_then(std::clone::Clone::clone),
                voting_score: public_scores
                    .get(&team.id)
                    .and_then(std::clone::Clone::clone),
                extra_score: bonus_scores.get(&team.id).copied().unwrap_or(0.0),
                final_score: *final_score.get(&team.id).unwrap_or(&0.0),
                max_final_score: max_final_score.map(|(_, s)| *s),
                rank: ranking.get(&team.id).map(|r| *r),
            })
            .sorted_by_key(|s| s.rank)
            .collect::<Vec<_>>())
    }
}
