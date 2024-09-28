"use client";

import { useGetTeamLeaderboard } from "@/api/gen";
import { useGetLeaderboard } from "@/api/gen/hooks/useGetLeaderboard";
import { useGetSidequests } from "@/api/gen/hooks/useGetSidequests";

import { Group, Table } from "@mantine/core";

import { IconTrophy } from "@tabler/icons-react";
import { UUID } from "crypto";

type Props = {
  eventId: UUID;
};

export default function SidequestTeamLeaderboard({ eventId }: Props) {
  // const {data: sidequest} = useGetSidequests();
  const { data } = useGetTeamLeaderboard({ event_id: eventId });
  console.log(data);

  const get_icon = (rank: number) => {
    switch (rank) {
      case 1:
        return <IconTrophy color="gold" />;
      case 2:
        return <IconTrophy color="silver" />;
      case 3:
        return <IconTrophy color="bronze" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Points</Table.Th>
            <Table.Th>Team</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data?.map((item) => (
            <Table.Tr key={item.group_id}>
              <Table.Td>
                <Group>
                  {get_icon(item.rank)}
                  {item.result}
                </Group>
              </Table.Td>
              <Table.Td>{item.group_name}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
}
