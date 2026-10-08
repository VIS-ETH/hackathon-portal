"use client";

import { useGetProjects, useGetTeams, useGetTeamsRoles } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import PageSkeleton from "@/components/PageSkeleton";
import TeamCard from "@/components/team/TeamCard";
import { useResolveParams } from "@/hooks/useResolveParams";

import { Divider, Stack, Text, Title } from "@mantine/core";

const Teams = () => {
  const { event, policies } = useResolveParams();

  const { data: teams } = useGetTeams(
    {
      event_id: event?.id ?? "",
    },
    {
      query: {
        enabled: !!event,
      },
    },
  );

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

  const { data: projects } = useGetProjects(
    {
      event_id: event?.id ?? "",
    },
    {
      query: {
        enabled: !!event && policies?.can_view_project,
      },
    },
  );

  if (!event || !teams || !teamsRoles) {
    return <PageSkeleton />;
  }

  const myTeams = teams.filter((team) => teamsRoles[team.id]);
  const otherTeams = teams.filter((team) => !teamsRoles[team.id]);

  const teamCard = (team: Team, highlight?: boolean) => (
    <TeamCard
      key={team.id}
      eventSlug={event.slug}
      team={team}
      roles={teamsRoles[team.id] ?? []}
      projectName={
        projects?.find((project) => project.id === team.project_id)?.name
      }
      highlight={highlight}
    />
  );

  return (
    <Stack>
      <Title order={2}>Teams</Title>
      {teams.length === 0 && <Text c="dimmed">No teams found</Text>}
      {myTeams.map((team) => teamCard(team, true))}
      {myTeams.length > 0 && otherTeams.length > 0 && <Divider />}
      {otherTeams.map((team) => teamCard(team))}
    </Stack>
  );
};

export default Teams;
