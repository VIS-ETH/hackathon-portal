"use client";

import { useGetTeams } from "@/api/gen";
import Sponsors from "@/componentes/Sponsors";
import TeamOverview from "@/componentes/TeamOverview";

import {
  Card,
  Center,
  Divider,
  Flex,
  Grid,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { useParams } from "next/navigation";

export default function Page() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const event_id = "fae4d7ff-ee08-4e16-8802-a1b1797145d5";

  const { data: teams } = useGetTeams({ event_id: event_id });
  const my_team_ids = ["1a938d0b-fd72-4ae3-8a77-e1ff6f4cf68e"];

  const my_teams = teams?.filter((team) => my_team_ids.includes(team.id));
  // const other_teams = teams?.filter((team) => !my_team_ids.includes(team.id));

  return (
    <Stack>
      <Title order={2}>Your Teams</Title>
      {my_teams &&
        my_teams.map((team) => <TeamOverview key={team.id} team={team} />)}
      <Divider />
      <Title order={2}>All Teams</Title>
      {teams && teams.map((team) => <TeamOverview key={team.id} team={team} />)}
    </Stack>

    // <Grid align="stretch">
    //   <Grid.Col span={6}>

    //   <Card withBorder h={"100%"}>
    //     <Center>
    //       <Stack justify="center" align="center">

    //       <Title order={2}>Teams</Title>
    //       <Text>Here you can see all the teams that are participating in the event</Text>
    //       </Stack>
    //     </Center>
    //   </Card>
    //   </Grid.Col>
    //   <Grid.Col span={6}>

    //   <Card withBorder h={"100%"}>
    //     <Center>
    //       <Stack justify="center" align="center">

    //       <Title order={2}>My Team</Title>
    //       <Text>Manage your members and project preferences</Text>
    //       </Stack>
    //     </Center>
    //   </Card>
    //   </Grid.Col>
  );
}
