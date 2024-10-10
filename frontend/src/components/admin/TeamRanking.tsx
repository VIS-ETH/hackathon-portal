import TeamRankingEntry from "./TeamRankingEntry";

import { useGetLeaderboard, useGetTeams } from "@/api/gen";
import { Team } from "@/api/gen/schemas";

import { Stack } from "@mantine/core";

type TeamRankingProps = {
  eventId: string;
};

const TeamRanking = ({ eventId }: TeamRankingProps) => {
  const { data: leaderboardIds = [] } = useGetLeaderboard(eventId);
  const { data: teams = [] } = useGetTeams({
    event_id: eventId,
  });

  const leaderboardTeams = leaderboardIds
    .map((teamId) => teams.find((team) => team.id === teamId))
    .filter((team) => team) as Team[];

  return (
    <Stack>
      {leaderboardTeams.map((team, index) => (
        <TeamRankingEntry key={team.id} team={team} rank={index + 1} />
      ))}
    </Stack>
  );
};

export default TeamRanking;
