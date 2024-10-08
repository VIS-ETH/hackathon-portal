"use client";

import { useGetTeams, useGetTeamsRoles } from "@/api/gen";
import { TeamRole } from "@/api/gen/schemas";
import PageSkeleton from "@/components/PageSkeleton";
import CreateTeamCard from "@/components/registration/CreateTeamCard";
import ProjectPreferencesInput from "@/components/registration/ProjectPreferencesInput";
import TeamMembersInput from "@/components/registration/TeamMembersInput";
import TeamNameInput from "@/components/registration/TeamNameInput";
import { useResolveParams } from "@/hooks/useResolveParams";

import { Divider, Stack, Title } from "@mantine/core";

const Documentation = () => {
  const { event } = useResolveParams();

  const { data: teams, refetch: refetchTeams } = useGetTeams(
    {
      event_id: event?.id ?? "",
    },
    {
      query: {
        enabled: !!event,
      },
    },
  );

  const { data: teamsRoles, refetch: refetchTeamsRoles } = useGetTeamsRoles(
    {
      event_id: event?.id ?? "",
    },
    {
      query: {
        enabled: !!event,
      },
    },
  );

  if (!event || !teamsRoles) {
    return <PageSkeleton />;
  }

  const team = teams?.find((team) =>
    teamsRoles[team.id]?.includes(TeamRole.Member),
  );

  const refetch = () => {
    refetchTeams();
    refetchTeamsRoles();
  };

  return (
    <Stack>
      <Title order={2}>{team ? team.name : "Registration"}</Title>
      {team ? (
        <>
          <ProjectPreferencesInput team={team} refetch={refetch} />
          <Divider />
          <TeamNameInput team={team} refetch={refetch} />
          <Divider />
          <TeamMembersInput team={team} refetch={refetch} />
        </>
      ) : (
        <CreateTeamCard eventId={event.id} refetch={refetch} />
      )}
    </Stack>
  );
};

export default Documentation;
