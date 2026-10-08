"use client";

import IconTextGroup from "../IconTextGroup";

import { useGetEvent, useGetProject } from "@/api/gen";
import { Team } from "@/api/gen/schemas";

import { Stack, Text } from "@mantine/core";

import { IconListDetails, IconUsers, IconWorld } from "@tabler/icons-react";
import Link from "next/link";

type TeamLinksProps = {
  team: Team;
  canViewProject: boolean;
  // also link the team's page, for views outside of it
  teamPage?: boolean;
};

const TeamLinks = ({ team, canViewProject, teamPage }: TeamLinksProps) => {
  const { data: event } = useGetEvent(team.event_id);
  const { data: project } = useGetProject(team?.project_id ?? "", {
    query: { enabled: !!team?.project_id && canViewProject },
  });

  const teamLink = teamPage && event && (
    <IconTextGroup Icon={IconUsers}>
      <Link href={`/events/${event.slug}/teams/${team.slug}`} passHref>
        <Text>{team.name}</Text>
      </Link>
    </IconTextGroup>
  );

  const projectLink = (
    <IconTextGroup Icon={IconListDetails}>
      {event && project ? (
        <Link
          href={`/events/${event.slug}/projects/${project.slug}`}
          passHref
          referrerPolicy="no-referrer"
        >
          <Text>{project.name}</Text>
        </Link>
      ) : (
        <Text c="dimmed">No project assigned</Text>
      )}
    </IconTextGroup>
  );

  const ingressUrlLink = (
    <IconTextGroup Icon={IconWorld}>
      {team.ingress_url ? (
        <Link
          href={team.ingress_url}
          passHref
          referrerPolicy="no-referrer"
          target="_blank"
        >
          <Text>{team.ingress_url}</Text>
        </Link>
      ) : (
        <Text c="dimmed">No public URL</Text>
      )}
    </IconTextGroup>
  );

  return (
    <Stack gap="sm">
      {teamLink}
      {projectLink}
      {ingressUrlLink}
    </Stack>
  );
};

export default TeamLinks;
