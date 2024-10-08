"use client";

import { useGetTeams, useGetTeamsRoles } from "@/api/gen";
import PageSkeleton from "@/components/PageSkeleton";
import TeamCard from "@/components/team/TeamCard";
import { useResolveParams } from "@/hooks/useResolveParams";

import { Divider, Stack, Title } from "@mantine/core";

const Teams = () => {
  const { event } = useResolveParams();

  const { data: teams } = useGetTeams({
    event_id: event?.id ?? "",
  });

  const { data: teamsRoles } = useGetTeamsRoles(
    {
      event_id: event?.id ?? "",
    },
    {
      query: {
        enabled: !!event,
      },
    },
  );

  if (!teams || !teamsRoles) {
    return <PageSkeleton />;
  }

  const myTeams = teams.filter((team) => teamsRoles[team.id]);

  return (
    <Stack>
      <Title order={2}>Teams</Title>
      {myTeams.map((team) => (
        <TeamCard key={team.id} team={team} highlight />
      ))}
      <Divider />
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </Stack>
  );
};

export default Teams;
