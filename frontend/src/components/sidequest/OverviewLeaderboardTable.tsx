import { useGetSidequestsOverviewLeaderboard } from "@/api/gen";
import { cardProps } from "@/styles/common";

import { Card, Table, Text } from "@mantine/core";

type OverviewLeaderboardTableProps = {
  eventId: string;
};

const OverviewLeaderboardTable = ({
  eventId,
}: OverviewLeaderboardTableProps) => {
  const { data: leaderboard = [] } =
    useGetSidequestsOverviewLeaderboard(eventId);

  return (
    <Card {...cardProps}>
      <Card.Section>
        <Table.ScrollContainer minWidth={350}>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Team</Table.Th>
                <Table.Th>Score</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {leaderboard.length ? (
                leaderboard.map((entry) => (
                  <Table.Tr key={entry.team_id}>
                    <Table.Td>{entry.team_name}</Table.Td>
                    <Table.Td>{entry.score}</Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={2}>
                    <Text ta="center" size="sm" c="dimmed">
                      No entries yet
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card.Section>
    </Card>
  );
};

export default OverviewLeaderboardTable;
