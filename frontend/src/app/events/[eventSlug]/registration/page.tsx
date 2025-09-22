"use client";

import { useGetTeams, useGetTeamsRoles } from "@/api/gen";
import { TeamRole } from "@/api/gen/schemas";
import PageSkeleton from "@/components/PageSkeleton";
import CreateTeamCard from "@/components/registration/CreateTeamCard";
import ProjectPreferencesInput from "@/components/registration/ProjectPreferencesInput";
import TeamMembersInput from "@/components/registration/TeamMembersInput";
import TeamNameInput from "@/components/registration/TeamNameInput";
import { useResolveParams } from "@/hooks/useResolveParams";

import { Stack } from "@mantine/core";

const Documentation = () => {
  const { event, policies } = useResolveParams();

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
    <>
      {team ? (
        <Stack gap="lg">
          <TeamNameInput team={team} refetch={refetch} />
          <TeamMembersInput team={team} refetch={refetch} />
          {policies?.can_view_project && (
            <ProjectPreferencesInput team={team} refetch={refetch} />
          )}
        </Stack>
      ) : (
        <CreateTeamCard eventId={event.id} refetch={refetch} />
      )}
    </>
  );
};

export default Documentation;
