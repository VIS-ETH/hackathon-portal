//! The ranking formula. Pure functions only, no IO.
//!
//! Every category has a raw `score`, normalized `points` and a competition `rank`:
//! - **technical:** `score` = sum of the team's technical ratings. `all_answered` is true if
//!   every question of the event has a rating for the team (also if there are no questions).
//!   20 points, ranked on `score`.
//! - **jury:** `score` = sum over categories of mean(rating) * weight (product 0.7,
//!   presentation 0.3). A category without ratings contributes 0, weights are not
//!   renormalized. 30 points, ranked on `score`.
//! - **public:** `score` = sum over votes of the place's points (1st: 5, 2nd: 3, 3rd: 1).
//!   30 points, ranked on `score`.
//! - **sidequest:** per sidequest, every user's best result is ranked; points start at the
//!   event's participant count and decrease by 1 per user (saturating at 0). Tied users all
//!   get the *lowest* points of their group. A team gets the mean over its members (members
//!   without attempts count as 0, a team without members gets 0). `score` = sum over
//!   sidequests. 10 points, ranked on `points` (not on `score`).
//!
//! `total_points` = sum of all category points + `extra_points` (`team.extra_score`, not
//! normalized). Teams are ranked on `total_points` and sorted by rank, ties keep the team
//! order (`index, name`).
//!
//! Normalization scales by `points = score / max * upper`. Competition ranks are computed on
//! `(value * 10000.0) as i32`, so values equal to 4 decimals tie (1, 1, 3).

use crate::ranking::input::{RankingInput, SidequestInput};
use crate::ranking::models::{
    JuryScore, PublicScore, Ranking, SidequestScore, TeamRanking, TechnicalAnswer, TechnicalScore,
};
use crate::{ServiceError, ServiceResult};
use hackathon_portal_repositories::db::{
    db_sidequest, JuryRatingCategory, SidequestBestResult, TeamRankingInput,
};
use std::cmp::Ordering;
use std::collections::{BTreeMap, HashMap};
use uuid::Uuid;

const TECHNICAL_MAX_POINTS: f64 = 20.0;
const JURY_MAX_POINTS: f64 = 30.0;
const SIDEQUEST_MAX_POINTS: f64 = 10.0;
const PUBLIC_MAX_POINTS: f64 = 30.0;

const fn jury_weight(category: JuryRatingCategory) -> f64 {
    match category {
        JuryRatingCategory::Product => 0.7,
        JuryRatingCategory::Presentation => 0.3,
    }
}

const fn public_vote_points(place: i32) -> f64 {
    match place {
        1 => 5.0,
        2 => 3.0,
        3 => 1.0,
        _ => 0.0,
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct UserPoints {
    pub user_id: Uuid,
    pub points: u64,
    pub result: f64,
}

pub fn rank(input: &RankingInput) -> ServiceResult<Ranking> {
    let technical_ratings = input
        .technical_ratings
        .iter()
        .map(|rating| ((rating.technical_question_id, rating.team_id), rating.score))
        .collect::<HashMap<_, _>>();
    let sidequest_scores = sidequest_team_scores(&input.sidequest);

    let mut teams = input
        .teams
        .iter()
        .map(|team| TeamRanking {
            team_id: team.id,
            team_name: team.name.clone(),
            team_index: team.index,
            finalist: team.finalist,
            rank: 0,
            total_points: 0.0,
            extra_points: team.extra_score.unwrap_or(0.0),
            technical: technical_score(input, &technical_ratings, team),
            jury: jury_score(input, team),
            sidequest: SidequestScore {
                score: sidequest_scores.get(&team.id).copied().unwrap_or(0.0),
                points: 0.0,
                rank: 0,
            },
            public: public_score(input, team),
        })
        .collect::<Vec<_>>();

    let technical = values(&teams, |team| team.technical.score);
    let technical_points = normalize(&technical, TECHNICAL_MAX_POINTS, "technical")?;
    let technical_ranks = competition_rank(&technical);

    let jury = values(&teams, |team| team.jury.score);
    let jury_points = normalize(&jury, JURY_MAX_POINTS, "jury")?;
    let jury_ranks = competition_rank(&jury);

    let sidequest = values(&teams, |team| team.sidequest.score);
    let sidequest_points = normalize(&sidequest, SIDEQUEST_MAX_POINTS, "sidequest")?;

    let public = values(&teams, |team| team.public.score);
    let public_points = normalize(&public, PUBLIC_MAX_POINTS, "public")?;
    let public_ranks = competition_rank(&public);

    for team in &mut teams {
        let id = team.team_id;
        team.technical.points = technical_points[&id];
        team.technical.rank = technical_ranks[&id];
        team.jury.points = jury_points[&id];
        team.jury.rank = jury_ranks[&id];
        team.sidequest.points = sidequest_points[&id];
        team.public.points = public_points[&id];
        team.public.rank = public_ranks[&id];
        team.total_points = team.technical.points
            + team.jury.points
            + team.sidequest.points
            + team.public.points
            + team.extra_points;
    }

    // Sidequests are ranked on points, all other categories on the raw score. This is
    // inconsistent, but kept so that past rankings stay reproducible.
    let sidequest_ranks = competition_rank(&values(&teams, |team| team.sidequest.points));
    let total_ranks = competition_rank(&values(&teams, |team| team.total_points));
    for team in &mut teams {
        team.sidequest.rank = sidequest_ranks[&team.team_id];
        team.rank = total_ranks[&team.team_id];
    }
    // stable, so tied teams keep the `index, name` order
    teams.sort_by_key(|team| team.rank);

    let max_total_points = teams
        .iter()
        .map(|team| team.total_points)
        .max_by(|a, b| a.partial_cmp(b).unwrap_or(Ordering::Equal))
        .unwrap_or(0.0);

    Ok(Ranking {
        max_total_points,
        teams,
    })
}

/// Points of every user with an attempt in `sidequest`, sorted best-first.
/// `best_results` may contain the results of other sidequests; they are ignored.
#[must_use]
pub fn sidequest_user_points(
    sidequest: &db_sidequest::Model,
    best_results: &[SidequestBestResult],
    participant_count: u64,
) -> Vec<UserPoints> {
    let mut results = best_results
        .iter()
        .filter(|best| best.sidequest_id == sidequest.id)
        .map(|best| {
            if sidequest.is_higher_result_better {
                (best.user_id, best.max_result)
            } else {
                (best.user_id, best.min_result)
            }
        })
        .collect::<Vec<_>>();

    if sidequest.is_higher_result_better {
        results.sort_by(|(_, a), (_, b)| b.total_cmp(a));
    } else {
        results.sort_by(|(_, a), (_, b)| a.total_cmp(b));
    }

    // Keyed by the exact result and the last assignment wins, so tied users all get the
    // lowest points of their group. Unlike competition ranking, but kept on purpose so that
    // past rankings stay reproducible.
    let mut points_by_result = HashMap::new();
    let mut points = participant_count;
    for (_, result) in &results {
        points_by_result.insert(result.to_bits(), points);
        points = points.saturating_sub(1);
    }

    results
        .into_iter()
        .map(|(user_id, result)| UserPoints {
            user_id,
            points: points_by_result[&result.to_bits()],
            result,
        })
        .collect()
}

/// `team_id` -> sidequest score, for every team in `input.team_ids`.
#[must_use]
pub fn sidequest_team_scores(input: &SidequestInput) -> HashMap<Uuid, f64> {
    let mut members = HashMap::<Uuid, Vec<Uuid>>::new();
    for member in &input.members {
        members
            .entry(member.team_id)
            .or_default()
            .push(member.user_id);
    }

    let mut scores = input
        .team_ids
        .iter()
        .map(|team_id| (*team_id, 0.0))
        .collect::<HashMap<_, _>>();

    for sidequest in &input.sidequests {
        let user_points =
            sidequest_user_points(sidequest, &input.best_results, input.participant_count)
                .into_iter()
                .map(|user| (user.user_id, user.points))
                .collect::<HashMap<_, _>>();

        for (team_id, score) in &mut scores {
            let Some(team_members) = members.get(team_id) else {
                continue; // a team without members gets 0
            };

            let sum = team_members
                .iter()
                .filter_map(|user_id| user_points.get(user_id))
                .fold(0.0, |sum, points| sum + *points as f64);

            *score += sum / team_members.len() as f64;
        }
    }

    scores
}

/// `ratings`: (`question_id`, `team_id`) -> score
fn technical_score(
    input: &RankingInput,
    ratings: &HashMap<(Uuid, Uuid), f64>,
    team: &TeamRankingInput,
) -> TechnicalScore {
    let mut score = 0.0;
    let mut all_answered = true;
    let mut answers = Vec::with_capacity(input.technical_questions.len());

    // in question order (by id), so the float sum and with it past rankings stay reproducible
    for question in &input.technical_questions {
        let rating = ratings.get(&(question.id, team.id)).copied();
        match rating {
            Some(rating) => score += rating,
            None => all_answered = false,
        }
        answers.push(TechnicalAnswer {
            question_id: question.id,
            question: question.question.clone(),
            description: question.description.clone(),
            min_points: question.min_points,
            max_points: question.max_points,
            binary: question.binary,
            score: rating,
        });
    }

    TechnicalScore {
        score,
        points: 0.0,
        rank: 0,
        all_answered,
        answers,
    }
}

fn jury_score(input: &RankingInput, team: &TeamRankingInput) -> JuryScore {
    let mean = |category: JuryRatingCategory| {
        let (sum, count) = input
            .jury_ratings
            .iter()
            .filter(|rating| rating.team_id == team.id && rating.category == category)
            .fold((0.0, 0), |(sum, count), rating| {
                (sum + rating.rating, count + 1)
            });

        (count > 0).then(|| sum / f64::from(count))
    };

    let product = mean(JuryRatingCategory::Product);
    let presentation = mean(JuryRatingCategory::Presentation);

    let score = [
        (JuryRatingCategory::Product, product),
        (JuryRatingCategory::Presentation, presentation),
    ]
    .into_iter()
    .filter_map(|(category, mean)| Some(mean? * jury_weight(category)))
    .fold(0.0, |sum, weighted| sum + weighted);

    JuryScore {
        score,
        points: 0.0,
        rank: 0,
        presentation_score: presentation.unwrap_or(0.0),
        product_score: product.unwrap_or(0.0),
    }
}

fn public_score(input: &RankingInput, team: &TeamRankingInput) -> PublicScore {
    let mut votes = BTreeMap::new();
    for vote in input.votes.iter().filter(|vote| vote.team_id == team.id) {
        *votes.entry(vote.place).or_insert(0) += 1;
    }

    let score = votes.iter().fold(0.0, |sum, (place, count)| {
        sum + public_vote_points(*place) * f64::from(*count)
    });

    PublicScore {
        score,
        points: 0.0,
        rank: 0,
        votes,
    }
}

fn values(teams: &[TeamRanking], value: impl Fn(&TeamRanking) -> f64) -> Vec<(Uuid, f64)> {
    teams
        .iter()
        .map(|team| (team.team_id, value(team)))
        .collect()
}

// exact comparison with 0 is part of the formula
fn normalize(
    values: &[(Uuid, f64)],
    upper: f64,
    category: &str,
) -> ServiceResult<HashMap<Uuid, f64>> {
    let Some(max) = values
        .iter()
        .map(|(_, value)| *value)
        .max_by(|a, b| a.partial_cmp(b).unwrap_or(Ordering::Equal))
    else {
        return Ok(HashMap::new());
    };

    if values.iter().all(|(_, value)| *value == 0.0) {
        return Ok(values.iter().map(|(id, _)| (*id, 0.0)).collect());
    }

    if max == 0.0 {
        return Err(ServiceError::ScoreCalculationError {
            message: format!("Failed to normalize {category} scores"),
        });
    }

    Ok(values
        .iter()
        .map(|(id, value)| (*id, value / max * upper))
        .collect())
}

fn competition_rank(values: &[(Uuid, f64)]) -> HashMap<Uuid, i32> {
    // saturating cast, values equal to 4 decimals get the same key
    let mut keys = values
        .iter()
        .map(|(id, value)| (*id, (value * 10000.0) as i32))
        .collect::<Vec<_>>();
    keys.sort_by(|(_, a), (_, b)| b.cmp(a));

    let mut rank_by_key = HashMap::new();
    for (rank, (_, key)) in (1..).zip(&keys) {
        rank_by_key.entry(*key).or_insert(rank);
    }

    keys.into_iter()
        .map(|(id, key)| (id, rank_by_key[&key]))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use hackathon_portal_repositories::db::{
        db_jury_rating, db_team_role_assignment, db_technical_question, db_technical_rating,
        db_vote, TeamRole,
    };

    // region: builders

    fn team(index: i32) -> TeamRankingInput {
        TeamRankingInput {
            id: Uuid::new_v4(),
            name: format!("team {index}"),
            index,
            finalist: false,
            extra_score: None,
        }
    }

    fn input(teams: &[TeamRankingInput]) -> RankingInput {
        RankingInput {
            teams: teams.to_vec(),
            technical_questions: Vec::new(),
            technical_ratings: Vec::new(),
            jury_ratings: Vec::new(),
            votes: Vec::new(),
            sidequest: SidequestInput {
                team_ids: teams.iter().map(|team| team.id).collect(),
                sidequests: Vec::new(),
                best_results: Vec::new(),
                participant_count: 0,
                members: Vec::new(),
            },
        }
    }

    fn question() -> db_technical_question::Model {
        db_technical_question::Model {
            id: Uuid::new_v4(),
            event_id: Uuid::nil(),
            question: "question".to_string(),
            description: None,
            min_points: 0,
            max_points: 10,
            binary: false,
        }
    }

    fn technical_rating(
        question: &db_technical_question::Model,
        team: &TeamRankingInput,
        score: f64,
    ) -> db_technical_rating::Model {
        db_technical_rating::Model {
            technical_question_id: question.id,
            team_id: team.id,
            score,
        }
    }

    fn jury_rating(
        team: &TeamRankingInput,
        category: JuryRatingCategory,
        rating: f64,
    ) -> db_jury_rating::Model {
        db_jury_rating::Model {
            id: Uuid::new_v4(),
            team_id: team.id,
            user_id: Uuid::new_v4(),
            category,
            rating,
        }
    }

    fn vote(team: &TeamRankingInput, place: i32) -> db_vote::Model {
        db_vote::Model {
            id: Uuid::new_v4(),
            place,
            team_id: team.id,
            user_id: Uuid::new_v4(),
        }
    }

    fn sidequest(is_higher_result_better: bool) -> db_sidequest::Model {
        db_sidequest::Model {
            id: Uuid::new_v4(),
            event_id: Uuid::nil(),
            name: "sidequest".to_string(),
            slug: "sidequest".to_string(),
            description: String::new(),
            is_higher_result_better,
        }
    }

    fn best_result(
        sidequest: &db_sidequest::Model,
        user_id: Uuid,
        result: f64,
    ) -> SidequestBestResult {
        SidequestBestResult {
            sidequest_id: sidequest.id,
            user_id,
            max_result: result,
            min_result: result,
        }
    }

    fn member(team: &TeamRankingInput, user_id: Uuid) -> db_team_role_assignment::Model {
        db_team_role_assignment::Model {
            user_id,
            team_id: team.id,
            role: TeamRole::Member,
        }
    }

    fn users(count: usize) -> Vec<Uuid> {
        (0..count).map(|_| Uuid::new_v4()).collect()
    }

    fn entry<'a>(ranking: &'a Ranking, team: &TeamRankingInput) -> &'a TeamRanking {
        ranking
            .teams
            .iter()
            .find(|entry| entry.team_id == team.id)
            .expect("team is ranked")
    }

    fn points_of(points: &[UserPoints]) -> Vec<(Uuid, u64)> {
        points
            .iter()
            .map(|user| (user.user_id, user.points))
            .collect()
    }

    // endregion

    // region: normalize

    #[test]
    fn normalize_empty() {
        let normalized = normalize(&[], 20.0, "test").expect("normalizes");
        assert!(normalized.is_empty());
    }

    #[test]
    fn normalize_all_zero() {
        let ids = users(2);
        let normalized =
            normalize(&[(ids[0], 0.0), (ids[1], 0.0)], 20.0, "test").expect("normalizes");
        assert_eq!(normalized[&ids[0]], 0.0);
        assert_eq!(normalized[&ids[1]], 0.0);
    }

    #[test]
    fn normalize_zero_max_with_negative_value_is_an_error() {
        let ids = users(2);
        let result = normalize(&[(ids[0], 0.0), (ids[1], -1.0)], 20.0, "test");
        assert!(matches!(
            result,
            Err(ServiceError::ScoreCalculationError { .. })
        ));
    }

    #[test]
    fn normalize_scales_to_upper() {
        let ids = users(2);
        let normalized =
            normalize(&[(ids[0], 5.0), (ids[1], 10.0)], 20.0, "test").expect("normalizes");
        assert_eq!(normalized[&ids[0]], 10.0);
        assert_eq!(normalized[&ids[1]], 20.0);
    }

    // endregion

    // region: competition_rank

    #[test]
    fn competition_rank_ties_share_rank_and_skip_next() {
        let ids = users(3);
        let ranks = competition_rank(&[(ids[0], 5.0), (ids[1], 10.0), (ids[2], 10.0)]);
        assert_eq!(ranks[&ids[1]], 1);
        assert_eq!(ranks[&ids[2]], 1);
        assert_eq!(ranks[&ids[0]], 3);
    }

    #[test]
    fn competition_rank_truncates_to_four_decimals() {
        let ids = users(3);
        let ranks = competition_rank(&[(ids[0], 1.000_01), (ids[1], 1.000_02), (ids[2], 0.5)]);
        assert_eq!(ranks[&ids[0]], 1);
        assert_eq!(ranks[&ids[1]], 1);
        assert_eq!(ranks[&ids[2]], 3);
    }

    // endregion

    // region: technical

    #[test]
    fn technical_sums_ratings_and_tracks_unanswered_questions() {
        let (a, b) = (team(0), team(1));
        let (q1, q2) = (question(), question());
        let mut input = input(&[a.clone(), b.clone()]);
        input.technical_ratings = vec![
            technical_rating(&q1, &a, 3.0),
            technical_rating(&q2, &a, 4.5),
            technical_rating(&q1, &b, 3.0),
        ];
        input.technical_questions = vec![q1.clone(), q2.clone()];

        let ranking = rank(&input).expect("ranks");

        let a = &entry(&ranking, &a).technical;
        assert_eq!(a.score, 7.5);
        assert_eq!(a.points, TECHNICAL_MAX_POINTS);
        assert_eq!(a.rank, 1);
        assert!(a.all_answered);

        let b = &entry(&ranking, &b).technical;
        assert_eq!(b.score, 3.0);
        assert_eq!(b.points, 3.0 / 7.5 * TECHNICAL_MAX_POINTS);
        assert_eq!(b.rank, 2);
        assert!(!b.all_answered);
        assert_eq!(
            b.answers,
            vec![
                TechnicalAnswer {
                    question_id: q1.id,
                    question: q1.question.clone(),
                    description: q1.description.clone(),
                    min_points: q1.min_points,
                    max_points: q1.max_points,
                    binary: q1.binary,
                    score: Some(3.0),
                },
                TechnicalAnswer {
                    question_id: q2.id,
                    question: q2.question.clone(),
                    description: q2.description.clone(),
                    min_points: q2.min_points,
                    max_points: q2.max_points,
                    binary: q2.binary,
                    score: None,
                },
            ]
        );
        assert_eq!(
            a.answers
                .iter()
                .map(|answer| answer.score)
                .collect::<Vec<_>>(),
            vec![Some(3.0), Some(4.5)]
        );
    }

    #[test]
    fn technical_all_answered_without_questions() {
        let a = team(0);
        let ranking = rank(&input(std::slice::from_ref(&a))).expect("ranks");

        let a = &entry(&ranking, &a).technical;
        assert_eq!(a.score, 0.0);
        assert!(a.all_answered);
        assert_eq!(a.answers, Vec::<TechnicalAnswer>::new());
    }

    // endregion

    // region: jury

    #[test]
    fn jury_weights_category_means() {
        let a = team(0);
        let mut input = input(std::slice::from_ref(&a));
        input.jury_ratings = vec![
            jury_rating(&a, JuryRatingCategory::Product, 8.0),
            jury_rating(&a, JuryRatingCategory::Product, 6.0),
            jury_rating(&a, JuryRatingCategory::Presentation, 9.0),
        ];

        let ranking = rank(&input).expect("ranks");

        let a = &entry(&ranking, &a).jury;
        assert_eq!(a.product_score, 7.0);
        assert_eq!(a.presentation_score, 9.0);
        assert_eq!(a.score, 7.0 * 0.7 + 9.0 * 0.3);
        assert_eq!(a.points, JURY_MAX_POINTS);
    }

    #[test]
    fn jury_missing_category_counts_as_zero() {
        let (a, b) = (team(0), team(1));
        let mut input = input(&[a.clone(), b.clone()]);
        input.jury_ratings = vec![
            jury_rating(&a, JuryRatingCategory::Presentation, 10.0),
            jury_rating(&b, JuryRatingCategory::Product, 10.0),
            jury_rating(&b, JuryRatingCategory::Presentation, 10.0),
        ];

        let ranking = rank(&input).expect("ranks");

        // not renormalized to the presentation weight alone
        let a = &entry(&ranking, &a).jury;
        assert_eq!(a.score, 10.0 * 0.3);
        assert_eq!(a.product_score, 0.0);
        assert_eq!(a.rank, 2);
        assert_eq!(entry(&ranking, &b).jury.rank, 1);
    }

    // endregion

    // region: public

    #[test]
    fn public_points_per_place_and_votes_map() {
        let (a, b) = (team(0), team(1));
        let mut input = input(&[a.clone(), b.clone()]);
        input.votes = vec![
            vote(&a, 1),
            vote(&a, 1),
            vote(&a, 2),
            vote(&a, 3),
            vote(&a, 4),
        ];

        let ranking = rank(&input).expect("ranks");

        let a = &entry(&ranking, &a).public;
        assert_eq!(a.score, 5.0 + 5.0 + 3.0 + 1.0);
        assert_eq!(a.points, PUBLIC_MAX_POINTS);
        assert_eq!(a.votes, BTreeMap::from([(1, 2), (2, 1), (3, 1), (4, 1)]));

        let b = &entry(&ranking, &b).public;
        assert_eq!(b.score, 0.0);
        assert!(b.votes.is_empty());
        assert_eq!(b.rank, 2);
    }

    // endregion

    // region: sidequest

    #[test]
    fn sidequest_user_points_higher_is_better() {
        let quest = sidequest(true);
        let other = sidequest(true);
        let u = users(3);
        let results = vec![
            best_result(&quest, u[0], 3.0),
            best_result(&quest, u[1], 7.0),
            best_result(&quest, u[2], 5.0),
            best_result(&other, u[0], 100.0),
        ];

        let points = sidequest_user_points(&quest, &results, 10);

        assert_eq!(points_of(&points), vec![(u[1], 10), (u[2], 9), (u[0], 8)]);
        assert_eq!(points[0].result, 7.0);
    }

    #[test]
    fn sidequest_user_points_lower_is_better() {
        let quest = sidequest(false);
        let u = users(3);
        let results = vec![
            best_result(&quest, u[0], 3.0),
            best_result(&quest, u[1], 7.0),
            best_result(&quest, u[2], 5.0),
        ];

        let points = sidequest_user_points(&quest, &results, 10);

        assert_eq!(points_of(&points), vec![(u[0], 10), (u[2], 9), (u[1], 8)]);
    }

    #[test]
    fn sidequest_user_points_lower_is_better_uses_min_result() {
        let quest = sidequest(false);
        let u = users(2);
        let results = vec![
            SidequestBestResult {
                sidequest_id: quest.id,
                user_id: u[0],
                max_result: 9.0,
                min_result: 1.0,
            },
            best_result(&quest, u[1], 2.0),
        ];

        let points = sidequest_user_points(&quest, &results, 10);

        assert_eq!(points_of(&points), vec![(u[0], 10), (u[1], 9)]);
        assert_eq!(points[0].result, 1.0);
    }

    #[test]
    fn sidequest_user_points_saturate_at_zero() {
        let quest = sidequest(true);
        let u = users(3);
        let results = vec![
            best_result(&quest, u[0], 3.0),
            best_result(&quest, u[1], 2.0),
            best_result(&quest, u[2], 1.0),
        ];

        let points = sidequest_user_points(&quest, &results, 1);

        assert_eq!(points_of(&points), vec![(u[0], 1), (u[1], 0), (u[2], 0)]);
    }

    /// Intentional quirk: tied users get the lowest points of their group.
    #[test]
    fn sidequest_user_points_tie_quirk() {
        let quest = sidequest(true);
        let u = users(3);
        let results = vec![
            best_result(&quest, u[0], 10.0),
            best_result(&quest, u[1], 10.0),
            best_result(&quest, u[2], 5.0),
        ];

        let points = sidequest_user_points(&quest, &results, 50)
            .into_iter()
            .map(|user| (user.user_id, user.points))
            .collect::<HashMap<_, _>>();

        assert_eq!(points[&u[0]], 49);
        assert_eq!(points[&u[1]], 49);
        assert_eq!(points[&u[2]], 48);
    }

    #[test]
    fn sidequest_team_score_averages_over_all_members() {
        let (a, b) = (team(0), team(1));
        let quest = sidequest(true);
        let u = users(3);
        let mut input = input(&[a.clone(), b.clone()]).sidequest;
        input.participant_count = 10;
        input.best_results = vec![
            best_result(&quest, u[0], 2.0),
            best_result(&quest, u[1], 1.0),
        ];
        input.members = vec![member(&a, u[0]), member(&a, u[1]), member(&a, u[2])];
        input.sidequests = vec![quest];

        let scores = sidequest_team_scores(&input);

        // u[2] has no attempt and counts as 0
        assert_eq!(scores[&a.id], (10.0 + 9.0) / 3.0);
        // no members
        assert_eq!(scores[&b.id], 0.0);
    }

    #[test]
    fn sidequest_team_score_sums_over_sidequests() {
        let a = team(0);
        let (first, second) = (sidequest(true), sidequest(false));
        let u = users(2);
        let mut input = input(std::slice::from_ref(&a)).sidequest;
        input.participant_count = 10;
        input.best_results = vec![
            best_result(&first, u[0], 5.0),
            best_result(&first, u[1], 1.0),
            best_result(&second, u[0], 5.0),
            best_result(&second, u[1], 1.0),
        ];
        input.members = vec![member(&a, u[0])];
        input.sidequests = vec![first, second];

        let scores = sidequest_team_scores(&input);

        assert_eq!(scores[&a.id], 10.0 + 9.0);
    }

    /// Intentional quirk: sidequests are ranked on the normalized points.
    #[test]
    fn sidequest_rank_uses_normalized_points() {
        let (a, b, c) = (team(0), team(1), team(2));
        let quest = sidequest(true);
        let u = users(5);
        let mut input = input(&[a.clone(), b.clone(), c.clone()]);
        input.sidequest.participant_count = 200_000;
        input.sidequest.best_results = vec![
            best_result(&quest, u[0], 3.0), // 200000 points
            best_result(&quest, u[1], 2.0), // 199999 points
            best_result(&quest, u[2], 1.0), // 199998 points
        ];
        input.sidequest.members = vec![
            member(&c, u[0]),
            member(&a, u[1]),
            member(&a, u[3]),
            member(&b, u[2]),
            member(&b, u[4]),
        ];
        input.sidequest.sidequests = vec![quest];

        let ranking = rank(&input).expect("ranks");

        let (a, b, c) = (
            &entry(&ranking, &a).sidequest,
            &entry(&ranking, &b).sidequest,
            &entry(&ranking, &c).sidequest,
        );
        assert_eq!(a.score, 99_999.5);
        assert_eq!(b.score, 99_999.0);
        // the raw scores don't tie, but the points (4.999975 and 4.99995) do
        let raw = competition_rank(&[(u[1], a.score), (u[2], b.score)]);
        assert_ne!(raw[&u[1]], raw[&u[2]]);
        assert_eq!(c.rank, 1);
        assert_eq!(a.rank, 2);
        assert_eq!(b.rank, 2);
    }

    // endregion

    // region: total

    #[test]
    fn total_includes_extra_points_without_normalizing() {
        let (mut a, b) = (team(0), team(1));
        a.extra_score = Some(50.0);
        let q = question();
        let mut input = input(&[a.clone(), b.clone()]);
        input.technical_ratings =
            vec![technical_rating(&q, &a, 1.0), technical_rating(&q, &b, 2.0)];
        input.technical_questions = vec![q];

        let ranking = rank(&input).expect("ranks");

        let a = entry(&ranking, &a);
        assert_eq!(a.extra_points, 50.0);
        assert_eq!(a.total_points, 10.0 + 50.0);
        assert_eq!(a.rank, 1);
        assert_eq!(entry(&ranking, &b).total_points, 20.0);
        assert_eq!(ranking.max_total_points, 60.0);
    }

    #[test]
    fn total_ties_keep_team_order() {
        let (mut a, mut b, mut c) = (team(0), team(1), team(2));
        a.extra_score = Some(1.0);
        b.extra_score = Some(1.0);
        c.extra_score = Some(5.0);

        let ranking = rank(&input(&[b.clone(), a.clone(), c.clone()])).expect("ranks");

        let order = ranking
            .teams
            .iter()
            .map(|entry| (entry.team_id, entry.rank))
            .collect::<Vec<_>>();
        assert_eq!(order, vec![(c.id, 1), (b.id, 2), (a.id, 2)]);
        assert_eq!(ranking.max_total_points, 5.0);
    }

    #[test]
    fn total_without_teams() {
        let ranking = rank(&input(&[])).expect("ranks");
        assert_eq!(ranking.teams, Vec::<TeamRanking>::new());
        assert_eq!(ranking.max_total_points, 0.0);
    }

    // endregion

    #[test]
    fn fixture_v1_deserializes() {
        let ranking: Ranking =
            serde_json::from_str(include_str!("fixtures/ranking_v1.json")).expect("v1 fixture");

        assert_eq!(ranking.teams.len(), 2);
        // v1 predates the technical answers
        assert!(ranking
            .teams
            .iter()
            .all(|team| team.technical.answers.is_empty()));
        assert_eq!(
            ranking.teams[0].public.votes,
            BTreeMap::from([(1, 5), (2, 4), (3, 4)])
        );

        let json = serde_json::to_value(&ranking).expect("serializes");
        assert_eq!(
            serde_json::from_value::<Ranking>(json).expect("deserializes"),
            ranking
        );
    }
    /// Snapshots are read back from JSONB text, so parsing must restore every `f64` exactly
    /// (needs `serde_json`'s `float_roundtrip` feature).
    #[test]
    fn snapshot_json_round_trips_floats_exactly() {
        let mut ranking: Ranking =
            serde_json::from_str(include_str!("fixtures/ranking_v1.json")).expect("v1 fixture");
        ranking.max_total_points = 9.837_499_999_999_999;
        ranking.teams[0].total_points = 25.830_864_603_688_802;

        let text = serde_json::to_string(&ranking).expect("serializes");
        assert_eq!(
            serde_json::from_str::<Ranking>(&text).expect("deserializes"),
            ranking
        );
    }
}
