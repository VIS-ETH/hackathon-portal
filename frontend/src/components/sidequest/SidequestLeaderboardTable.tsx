import { useGetSidequestsUserLeaderboard } from "@/api/gen";
import { Sidequest } from "@/api/gen/schemas";
import { cardProps } from "@/styles/common";

import { Card, Table, Text } from "@mantine/core";

type SidequestLeaderboardTableProps = {
  sidequest: Sidequest;
};

const SidequestLeaderboardTable = ({
  sidequest,
}: SidequestLeaderboardTableProps) => {
  const { data: leaderboard = [] } = useGetSidequestsUserLeaderboard(
    sidequest.event_id,
    {
      sidequest_id: sidequest.id,
    },
  );

  return (
    <Card {...cardProps}>
      <Card.Section>
        <Table.ScrollContainer minWidth={350}>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Result</Table.Th>
                <Table.Th>Score</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {leaderboard.length ? (
                leaderboard.map((entry) => (
                  <Table.Tr key={entry.user_id}>
                    <Table.Td>{entry.user_name}</Table.Td>
                    <Table.Td>{entry.result}</Table.Td>
                    <Table.Td>{entry.score}</Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={3}>
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

export default SidequestLeaderboardTable;
