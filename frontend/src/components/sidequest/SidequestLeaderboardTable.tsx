import NoEntriesTr from "../NoEntriesTr";

import { useGetSidequestsUserLeaderboard } from "@/api/gen";
import { Sidequest } from "@/api/gen/schemas";

import { Table } from "@mantine/core";

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
    <Table.ScrollContainer minWidth={350}>
      <Table striped horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>User</Table.Th>
            <Table.Th w={100} ta="right">
              Result
            </Table.Th>
            <Table.Th w={100} ta="right">
              Points
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {leaderboard.length ? (
            leaderboard.map((entry) => (
              <Table.Tr key={entry.user_id}>
                <Table.Td>{entry.user_name}</Table.Td>
                <Table.Td ta="right">{entry.result}</Table.Td>
                <Table.Td ta="right">{entry.points}</Table.Td>
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

export default SidequestLeaderboardTable;
