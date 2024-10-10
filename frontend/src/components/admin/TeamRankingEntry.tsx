import TeamExpertRatingsTable from "./TeamExpertRatingsTable";

import {
  useGetExpertRatingsLeaderboard,
  useGetSidequestsLeaderboard,
} from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { cardProps } from "@/styles/common";

import { Accordion, Card, Group, SimpleGrid, Stack, Text } from "@mantine/core";

type TeamRankingEntryProps = {
  team: Team;
  rank: number;
};

const TeamRankingEntry = ({ team, rank }: TeamRankingEntryProps) => {
  const { data: expertRatingsLeaderboard = [] } =
    useGetExpertRatingsLeaderboard(team.event_id);
  const { data: sidequestsLeaderboard = [] } = useGetSidequestsLeaderboard(
    team.event_id,
  );

  const expertEntry = expertRatingsLeaderboard
    .map((entry, index) => ({
      rank: index + 1,
      entry,
    }))
    .find((entry) => entry.entry.team_id === team.id);

  const sidequestEntry = sidequestsLeaderboard
    .map((entry, index) => ({
      rank: index + 1,
      entry,
    }))
    .find((entry) => entry.entry.team_id === team.id);

  const expertRank = expertEntry?.rank ?? "-";
  const expertRating = expertEntry
    ? Math.round(expertEntry.entry.rating * 100) / 100
    : "-";

  const sidequestRank = sidequestEntry?.rank ?? "-";
  const sidequestScore = sidequestEntry
    ? Math.round(sidequestEntry.entry.score * 100) / 100
    : "-";

  return (
    <Card {...cardProps}>
      <Card.Section>
        <Accordion variant="filled">
          <Accordion.Item value="disclosure">
            <Accordion.Control>
              <SimpleGrid cols={3}>
                <Group align="center">
                  <Text ff="monospace">{rank}</Text>
                  <Text fw={600}>{team?.name}</Text>
                </Group>
                <Stack gap={0} ta="center">
                  <Text>
                    #{expertRank} | {expertRating}
                  </Text>
                  <Text c="dimmed">Expert</Text>
                </Stack>
                <Stack gap={0} ta="center">
                  <Text>
                    #{sidequestRank} | {sidequestScore}
                  </Text>
                  <Text c="dimmed">Sidequest</Text>
                </Stack>
              </SimpleGrid>
            </Accordion.Control>
            <Accordion.Panel>
              {expertEntry ? (
                <TeamExpertRatingsTable team={team} entry={expertEntry.entry} />
              ) : (
                <Text c="dimmed">No expert ratings</Text>
              )}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Card.Section>
    </Card>
  );
};

export default TeamRankingEntry;
