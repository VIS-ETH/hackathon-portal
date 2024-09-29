"use client";

import { useGetSidequest } from "@/api/gen";
import { useGetLeaderboard } from "@/api/gen/hooks/useGetLeaderboard";
import { useGetSidequests } from "@/api/gen/hooks/useGetSidequests";

import { Group, Stack, Table, Text, ThemeIcon, Title } from "@mantine/core";

import { IconTrophy } from "@tabler/icons-react";
import { UUID } from "crypto";

type Props = {
  sidequestId: UUID;
};

export default function SidequestLeaderboard({ sidequestId }: Props) {
  // const {data: sidequest} = useGetSidequests();
  const { data } = useGetLeaderboard(sidequestId);
  const { data: sidequest } = useGetSidequest(sidequestId);

  const first_place = Math.max(...(data?.map((item) => item.points) || []));
  const second_place = Math.max(
    ...(data?.map((item) => item.points) || []).filter(
      (item) => item < first_place,
    ),
  );
  const third_place = Math.max(
    ...(data?.map((item) => item.points) || []).filter(
      (item) => item < second_place,
    ),
  );

  console.log(first_place, second_place, third_place);

  const get_icon = (points: number) => {
    if (
      first_place == undefined ||
      second_place == undefined ||
      third_place == undefined
    ) {
      return null;
    }
    switch (points) {
      case first_place:
        return (
          <ThemeIcon variant="transparent">
            <IconTrophy color="gold" />
          </ThemeIcon>
        );
      case second_place:
        return (
          <ThemeIcon variant="transparent">
            <IconTrophy color="silver" />
          </ThemeIcon>
        );
      case third_place:
        return (
          <ThemeIcon variant="transparent">
            <IconTrophy color="#FF5733" />
          </ThemeIcon>
        );
      default:
        return <ThemeIcon variant="transparent" hidden></ThemeIcon>;
    }
  };

  return (
    <Stack>
      {sidequest && (
        <>
          <Title order={1}>{sidequest.name}</Title>
          <Text>{sidequest.description}</Text>
          <Title order={1}>{}</Title>
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
      )}
    </Stack>
  );
}
