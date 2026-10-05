use crate::ServiceResult;
use hackathon_portal_repositories::db::{
    db_jury_rating, db_sidequest, db_team_role_assignment, db_technical_question,
    db_technical_rating, db_vote, EventRole, EventRoleAssignmentRepository, JuryRatingRepository,
    SidequestAttemptRepository, SidequestBestResult, SidequestRepository, TeamRankingInput,
    TeamRepository, TeamRole, TeamRoleAssignmentRepository, TechnicalQuestionRepository,
    TechnicalRatingRepository, VoteRepository,
};
use sea_orm::ConnectionTrait;
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
    let teams = TeamRepository::fetch_ranking_inputs_by_event_id(db, event_id).await?;
    let technical_questions =
        TechnicalQuestionRepository::fetch_all_by_event_id(db, event_id).await?;
    let technical_ratings = TechnicalRatingRepository::fetch_all_by_event_id(db, event_id).await?;
    let jury_ratings = JuryRatingRepository::fetch_all_by_event_id(db, event_id).await?;
    let votes = VoteRepository::fetch_all_by_event_id(db, event_id).await?;

    let team_ids = teams.iter().map(|team| team.id).collect();
    let sidequest = load_sidequest_input_for_teams(db, event_id, team_ids).await?;

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
    let teams = TeamRepository::fetch_ranking_inputs_by_event_id(db, event_id).await?;
    let team_ids = teams.into_iter().map(|team| team.id).collect();

    load_sidequest_input_for_teams(db, event_id, team_ids).await
}

async fn load_sidequest_input_for_teams<C: ConnectionTrait>(
    db: &C,
    event_id: Uuid,
    team_ids: Vec<Uuid>,
) -> ServiceResult<SidequestInput> {
    let sidequests = SidequestRepository::fetch_all_by_event_id(db, event_id).await?;
    let best_results =
        SidequestAttemptRepository::fetch_best_results_by_event_id(db, event_id).await?;
    let members = TeamRoleAssignmentRepository::fetch_all_by_event_id_and_role(
        db,
        event_id,
        TeamRole::Member,
    )
    .await?;
    let participant_count = EventRoleAssignmentRepository::count_by_event_id_and_role(
        db,
        event_id,
        EventRole::Participant,
    )
    .await?;

    Ok(SidequestInput {
        team_ids,
        sidequests,
        best_results,
        participant_count,
        members,
    })
}
