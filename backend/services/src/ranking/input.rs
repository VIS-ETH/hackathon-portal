use crate::ServiceResult;
use hackathon_portal_repositories::db::{
    db_jury_rating, db_sidequest, db_team_role_assignment, db_technical_question,
    db_technical_rating, db_vote, EventRole, EventRoleAssignmentRepository, JuryRatingRepository,
    SidequestAttemptRepository, SidequestBestResult, SidequestRepository, TeamRankingInput,
    TeamRepository, TeamRole, TeamRoleAssignmentRepository, TechnicalQuestionRepository,
    TechnicalRatingRepository, VoteRepository,
};
use hackathon_portal_repositories::RepositoryResult;
use sea_orm::ConnectionTrait;
use tokio::try_join;
use uuid::Uuid;

/// Everything the ranking of one event is computed from.
#[derive(Debug, Clone)]
pub struct RankingInput {
    /// Ordered by `index, name`
    pub teams: Vec<TeamRankingInput>,
    /// Ordered by `id`
    pub technical_questions: Vec<db_technical_question::Model>,
    pub technical_ratings: Vec<db_technical_rating::Model>,
    pub jury_ratings: Vec<db_jury_rating::Model>,
    pub votes: Vec<db_vote::Model>,
    pub sidequest: SidequestInput,
}

#[derive(Debug, Clone)]
pub struct SidequestInput {
    pub team_ids: Vec<Uuid>,
    /// Ordered by `name`
    pub sidequests: Vec<db_sidequest::Model>,
    pub best_results: Vec<SidequestBestResult>,
    pub participant_count: u64,
    /// Team `MEMBER`s only
    pub members: Vec<db_team_role_assignment::Model>,
}

pub async fn load<C: ConnectionTrait>(db: &C, event_id: Uuid) -> ServiceResult<RankingInput> {
    let ((teams, sidequest), technical_questions, technical_ratings, jury_ratings, votes) = try_join!(
        load_teams_and_sidequest_input(db, event_id),
        TechnicalQuestionRepository::fetch_all_by_event_id(db, event_id),
        TechnicalRatingRepository::fetch_all_by_event_id(db, event_id),
        JuryRatingRepository::fetch_all_by_event_id(db, event_id),
        VoteRepository::fetch_all_by_event_id(db, event_id),
    )?;

    Ok(RankingInput {
        teams,
        technical_questions,
        technical_ratings,
        jury_ratings,
        votes,
        sidequest,
    })
}

pub async fn load_sidequest_input<C: ConnectionTrait>(
    db: &C,
    event_id: Uuid,
) -> ServiceResult<SidequestInput> {
    let (_, sidequest) = load_teams_and_sidequest_input(db, event_id).await?;

    Ok(sidequest)
}

async fn load_teams_and_sidequest_input<C: ConnectionTrait>(
    db: &C,
    event_id: Uuid,
) -> RepositoryResult<(Vec<TeamRankingInput>, SidequestInput)> {
    let (teams, sidequests, best_results, members, participant_count) = try_join!(
        TeamRepository::fetch_ranking_inputs_by_event_id(db, event_id),
        SidequestRepository::fetch_all_by_event_id(db, event_id),
        SidequestAttemptRepository::fetch_best_results_by_event_id(db, event_id),
        TeamRoleAssignmentRepository::fetch_all_by_event_id_and_role(
            db,
            event_id,
            TeamRole::Member
        ),
        EventRoleAssignmentRepository::count_by_event_id_and_role(
            db,
            event_id,
            EventRole::Participant
        ),
    )?;

    let team_ids = teams.iter().map(|team| team.id).collect();

    let sidequest = SidequestInput {
        team_ids,
        sidequests,
        best_results,
        participant_count,
        members,
    };

    Ok((teams, sidequest))
}
