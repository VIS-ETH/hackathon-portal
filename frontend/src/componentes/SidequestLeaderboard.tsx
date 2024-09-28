"use client";

import { useGetLeaderboard } from "@/api/gen/hooks/useGetLeaderboard";
import { useGetSidequests } from "@/api/gen/hooks/useGetSidequests";

import { Group, Table } from "@mantine/core";

import { IconTrophy } from "@tabler/icons-react";
import { UUID } from "crypto";

type Props = {
  sidequestId: UUID;
};

export default function SidequestLeaderboard({ sidequestId }: Props) {
  // const {data: sidequest} = useGetSidequests();
  const { data } = useGetLeaderboard(sidequestId);

  const top_three_scores = data?.reduce(
    (acc, item) => {
      if (item.points > acc[0]) {
        acc[2] = acc[1];
        acc[1] = acc[0];
        acc[0] = item.points;
      } else if (item.points > acc[1]) {
        acc[2] = acc[1];
        acc[1] = item.points;
      } else if (item.points > acc[2]) {
        acc[2] = item.points;
      }
      return acc;
    },
    [0, 0, 0],
  );

  const get_icon = (points: number) => {
    if (top_three_scores == undefined) {
      return null;
    }
    switch (points) {
      case top_three_scores[0]:
        return <IconTrophy color="gold" />;
      case top_three_scores[1]:
        return <IconTrophy color="silver" />;
      case top_three_scores[2]:
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
            <Table.Th>User</Table.Th>
            <Table.Th>Team</Table.Th>
            <Table.Th>Sidequest Result</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data?.map((item, i) => (
            <Table.Tr key={item.user_id}>
              <Table.Td>
                <Group>
                  {get_icon(item.points)}
                  {item.points}
                </Group>
              </Table.Td>
              <Table.Td>{item.user_name}</Table.Td>
              <Table.Td>{item.group_name}</Table.Td>
              <Table.Td>{item.result}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
}
