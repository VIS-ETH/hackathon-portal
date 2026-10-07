import NoEntriesTr from "../NoEntriesTr";

import { useGetSidequestsLeaderboard } from "@/api/gen";
import { fmtScore } from "@/utils";

import { Table } from "@mantine/core";

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

  // competition ranking, as in the team ranking: tied scores share a rank
  const rank = (score: number) =>
    1 + leaderboard.filter((other) => other.score > score).length;

  return (
    <Table.ScrollContainer minWidth={350}>
      <Table striped horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40} ta="right">
              #
            </Table.Th>
            <Table.Th>Team</Table.Th>
            <Table.Th w={100} ta="right">
              Score
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {leaderboard.length ? (
            leaderboard.slice(0, limit).map((entry) => (
              <Table.Tr key={entry.team_id}>
                <Table.Td ta="right">{rank(entry.score)}</Table.Td>
                <Table.Td>{entry.team_name}</Table.Td>
                <Table.Td ta="right">{fmtScore(entry.score)}</Table.Td>
              </Table.Tr>
            ))
          ) : (
            <NoEntriesTr colSpan={3} />
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};

export default OverviewLeaderboardTable;
