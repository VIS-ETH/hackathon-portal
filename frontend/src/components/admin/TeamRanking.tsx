import TeamRankingEntry from "./TeamRankingEntry";

import { useGetLeaderboardDetailed } from "@/api/gen";

import { Button, Group, Skeleton, Stack } from "@mantine/core";

type TeamRankingProps = {
  eventId: string;
};

const TeamRanking = ({ eventId }: TeamRankingProps) => {
  const {
    data: leaderboardEntry = [],
    isLoading,
    refetch,
  } = useGetLeaderboardDetailed(eventId);

  const refreshButton = (
    <Group justify="flex-end" w={"100%"}>
      {isLoading}
      <Button onClick={() => refetch()}>Refresh</Button>
    </Group>
  );

  if (isLoading) {
    return (
      <Stack pt={"md"}>
        {refreshButton}
        {Array.from({ length: 11 }, (_, i) => (
          <Skeleton key={i} height={60} radius="md" />
        ))}
      </Stack>
    );
  }
  return (
    <Stack pt={"md"}>
      {refreshButton}
      {leaderboardEntry.map((entry) => (
        <TeamRankingEntry key={entry.team_id} info={entry} />
      ))}
    </Stack>
  );
};

export default TeamRanking;
