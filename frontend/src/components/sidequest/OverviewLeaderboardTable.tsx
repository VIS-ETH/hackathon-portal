import NoEntriesTr from "../NoEntriesTr";

import { useGetSidequestsLeaderboard } from "@/api/gen";
import { cardProps } from "@/styles/common";

import { Card, Table } from "@mantine/core";

type OverviewLeaderboardTableProps = {
  eventId: string;
  limit?: number;
};

const OverviewLeaderboardTable = ({
  eventId,
  limit,
}: OverviewLeaderboardTableProps) => {
  const { data: leaderboard = [] } = useGetSidequestsLeaderboard(eventId, {
    query: {
      refetchInterval: 1000 * 60,
    },
  });

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
                leaderboard.slice(0, limit).map((entry) => (
                  <Table.Tr key={entry.team_id}>
                    <Table.Td>{entry.team_name}</Table.Td>
                    <Table.Td>{Math.round(entry.score * 100) / 100}</Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <NoEntriesTr colSpan={2} />
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card.Section>
    </Card>
  );
};

export default OverviewLeaderboardTable;
