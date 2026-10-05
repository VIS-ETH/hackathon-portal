pub mod models;
use crate::rating::models::{
    CreateTechnicalQuestion, JuryRating, JuryRatingForCreate, JuryRatingForUpdate, PublicVote,
    TechnicalQuestion, TechnicalQuestionResult, UpdateTechnicalQuestion, Vote,
};
use crate::ServiceError;
use crate::ServiceResult;
use hackathon_portal_repositories::db::{
    db_jury_rating, db_team, db_technical_question, db_technical_rating, db_vote,
    JuryRatingRepository, TechnicalQuestionRepository, VoteRepository,
};
use hackathon_portal_repositories::DbRepository;
use sea_orm::sea_query::{IntoCondition, OnConflict};
use sea_orm::TransactionTrait;
use sea_orm::{prelude::*, DeleteResult};
use sea_orm::{
    ActiveModelTrait, IntoActiveModel, JoinType, QueryOrder, QuerySelect, QueryTrait, Set,
};

#[derive(Clone)]
pub struct RatingService {
    db_repo: DbRepository,
}

fn validate_technical_question(
    question: &str,
    min_points: i32,
    max_points: i32,
) -> ServiceResult<()> {
    if question.trim().is_empty() {
        return Err(ServiceError::InvalidTechnicalQuestion {
            message: "the question must not be empty".to_string(),
        });
    }
    if min_points >= max_points {
        return Err(ServiceError::InvalidTechnicalQuestion {
            message: format!(
                "min points ({min_points}) must be lower than max points ({max_points})"
            ),
        });
    }
    Ok(())
}

impl RatingService {
    #[must_use]
    pub const fn new(db_repo: DbRepository) -> Self {
        Self { db_repo }
    }

    fn check_vote_range(vote: f64) -> ServiceResult<()> {
        if !(0.0..=10.0).contains(&vote) || (2.0 * vote).fract() != 0.0 {
            return Err(ServiceError::WrongVotingValue {
                given_value: vote,
                requirements: "0 <= r <= 10 && 2*r \\in N".to_string(),
            });
        }

        Ok(())
    }

    pub async fn create_jury_rating(
        &self,
        creator_id: Uuid,
        rating_fc: JuryRatingForCreate,
    ) -> ServiceResult<JuryRating> {
        Self::check_vote_range(rating_fc.rating)?;

        let active_rating = db_jury_rating::ActiveModel {
            user_id: Set(creator_id),
            team_id: Set(rating_fc.team_id),
            category: Set(rating_fc.category),
            rating: Set(rating_fc.rating),
            ..Default::default()
        };

        let rating = active_rating.insert(self.db_repo.conn()).await?;

        Ok(rating.into())
    }

    pub async fn get_jury_ratings(&self, team_id: Uuid) -> ServiceResult<Vec<JuryRating>> {
        let ratings =
            JuryRatingRepository::fetch_all_by_team_id(self.db_repo.conn(), team_id).await?;

        let ratings = ratings.into_iter().map(JuryRating::from).collect();

        Ok(ratings)
    }

    pub async fn get_jury_rating(&self, rating_id: Uuid) -> ServiceResult<JuryRating> {
        let rating = JuryRatingRepository::fetch_by_id(self.db_repo.conn(), rating_id).await?;
        Ok(rating.into())
    }

    pub async fn update_jury_rating(
        &self,
        rating_id: Uuid,
        rating_fu: JuryRatingForUpdate,
    ) -> ServiceResult<JuryRating> {
        if let Some(value) = rating_fu.rating {
            Self::check_vote_range(value)?;
        }

        let rating = JuryRatingRepository::fetch_by_id(self.db_repo.conn(), rating_id).await?;

        let mut active_rating = rating.into_active_model();

        if let Some(rating) = rating_fu.rating {
            active_rating.rating = Set(rating);
        }

        let rating = active_rating.update(self.db_repo.conn()).await?;

        Ok(rating.into())
    }

    pub async fn delete_jury_rating(&self, rating_id: Uuid) -> ServiceResult<()> {
        let rating = JuryRatingRepository::fetch_by_id(self.db_repo.conn(), rating_id).await?;

        rating.delete(self.db_repo.conn()).await?;

        Ok(())
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

    pub async fn create_technical_question(
        &self,
        question_fc: CreateTechnicalQuestion,
    ) -> ServiceResult<TechnicalQuestion> {
        validate_technical_question(
            &question_fc.question,
            question_fc.min_points,
            question_fc.max_points,
        )?;

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
        event_id: Uuid,
        question_id: Uuid,
    ) -> ServiceResult<DeleteResult> {
        let trx = self.db_repo.conn().begin().await?;
        let question =
            TechnicalQuestionRepository::fetch_by_id_and_event_id(&trx, question_id, event_id)
                .await?;
        // ratings reference the question with ON DELETE RESTRICT
        db_technical_rating::Entity::delete_many()
            .filter(db_technical_rating::Column::TechnicalQuestionId.eq(question_id))
            .exec(&trx)
            .await?;
        let affected_rows = question.delete(&trx).await?;
        trx.commit().await?;
        Ok(affected_rows)
    }

    pub async fn update_technical_question(
        &self,
        event_id: Uuid,
        update_question: UpdateTechnicalQuestion,
    ) -> ServiceResult<TechnicalQuestion> {
        let trx = self.db_repo.conn().begin().await?;
        let question = TechnicalQuestionRepository::fetch_by_id_and_event_id(
            &trx,
            update_question.id,
            event_id,
        )
        .await?;
        validate_technical_question(
            update_question
                .question
                .as_deref()
                .unwrap_or(&question.question),
            update_question.min_points.unwrap_or(question.min_points),
            update_question.max_points.unwrap_or(question.max_points),
        )?;
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
        let team_event_id = db_team::Entity::find()
            .select_only()
            .column(db_team::Column::EventId)
            .filter(db_team::Column::Id.eq(team_id))
            .into_query();

        let ratings = db_technical_question::Entity::find()
            .select_also(db_technical_rating::Entity)
            .join(
                JoinType::LeftJoin,
                db_technical_question::Relation::TechnicalRating
                    .def()
                    .on_condition(move |_question, rating| {
                        Expr::col((rating, db_technical_rating::Column::TeamId))
                            .eq(team_id)
                            .into_condition()
                    }),
            )
            .filter(db_technical_question::Column::EventId.in_subquery(team_event_id))
            .order_by_asc(db_technical_question::Column::Id)
            .all(self.db_repo.conn())
            .await?
            .into_iter()
            .map(|(question, rating)| TechnicalQuestionResult {
                question: question.into(),
                score: rating.map(|rating| rating.score),
            })
            .collect();

        Ok(ratings)
    }

    pub async fn set_technical_rating(
        &self,
        event_id: Uuid,
        team_id: Uuid,
        question_id: Uuid,
        score: f64,
    ) -> ServiceResult<TechnicalQuestionResult> {
        let question = TechnicalQuestionRepository::fetch_by_id_and_event_id(
            self.db_repo.conn(),
            question_id,
            event_id,
        )
        .await?;

        #[expect(
            clippy::float_cmp,
            reason = "binary questions accept exactly min or max, both integers exactly representable in f64"
        )]
        let invalid_score = (question.binary
            && !(score == f64::from(question.min_points)
                || score == f64::from(question.max_points)))
            || (!question.binary
                && (score < f64::from(question.min_points)
                    || score > f64::from(question.max_points)));

        if invalid_score {
            return Err(ServiceError::WrongTechnicalRatingScore {
                given_score: score,
                allowed_scores: format!(
                    "{} {} {}",
                    question.min_points,
                    if question.binary { "or" } else { "-" },
                    question.max_points
                ),
            });
        }

        let rating = db_technical_rating::Entity::insert(db_technical_rating::ActiveModel {
            team_id: Set(team_id),
            technical_question_id: Set(question_id),
            score: Set(score),
        })
        .on_conflict(
            OnConflict::columns([
                db_technical_rating::Column::TechnicalQuestionId,
                db_technical_rating::Column::TeamId,
            ])
            .update_column(db_technical_rating::Column::Score)
            .to_owned(),
        )
        .exec_with_returning(self.db_repo.conn())
        .await?;

        Ok(TechnicalQuestionResult {
            question: question.into(),
            score: Some(rating.score),
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

        // check if they already voted for this team at another place
        if votes
            .iter()
            .any(|v| v.team_id == vote.team_id && v.place != vote.place)
        {
            return Err(ServiceError::DuplicateVote);
        }

        let updated_vote = if let Some(existing_vote) = votes.iter().find(|v| v.place == vote.place)
        {
            let mut active_vote = existing_vote.clone().into_active_model();
            active_vote.team_id = Set(vote.team_id);
            active_vote.update(&trx).await?
        } else {
            let active_vote = db_vote::ActiveModel {
                user_id: Set(user_id),
                team_id: Set(vote.team_id),
                place: Set(vote.place),
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
}
