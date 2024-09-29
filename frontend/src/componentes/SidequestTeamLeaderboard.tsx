"use client";

import { useGetTeamLeaderboard } from "@/api/gen";
import { useGetLeaderboard } from "@/api/gen/hooks/useGetLeaderboard";
import { useGetSidequests } from "@/api/gen/hooks/useGetSidequests";

import { Group, Table, ThemeIcon } from "@mantine/core";

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
        return (
          <ThemeIcon color="gold">
            <IconTrophy color="black" />
          </ThemeIcon>
        );
      case 2:
        return (
          <ThemeIcon color="silver">
            <IconTrophy color="black" />
          </ThemeIcon>
        );
      case 3:
        return (
          <ThemeIcon color="#FF5733">
            <IconTrophy color="black" />
          </ThemeIcon>
        );
      default:
        return (
          <ThemeIcon color="#FF5733" hidden>
            <IconTrophy color="black" />
          </ThemeIcon>
        );
    }
  };

  return (
    <>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Rank</Table.Th>
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
                  {item.rank}
                </Group>
              </Table.Td>
              <Table.Td>
                <Group>{item.result}</Group>
              </Table.Td>
              <Table.Td>{item.group_name}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
}
