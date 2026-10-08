import IconTextGroup from "../IconTextGroup";

import { useGetEvent, useGetProject } from "@/api/gen";
import { Team } from "@/api/gen/schemas";

import { Anchor, Group, Stack, Text } from "@mantine/core";

import {
  IconBrandGit,
  IconListDetails,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import Link from "next/link";

type TeamLinksProps = {
  team: Team;
  canViewProject: boolean;
  // also link the team's page, for views outside of it
  teamPage?: boolean;
  canViewRepository?: boolean;
  // given if the repository may be edited
  onEditRepository?: () => void;
};

const TeamLinks = ({
  team,
  canViewProject,
  teamPage,
  canViewRepository,
  onEditRepository,
}: TeamLinksProps) => {
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

  const repositoryLink = canViewRepository && (
    <IconTextGroup Icon={IconBrandGit}>
      {team.repository_url ? (
        <Group gap="xs">
          <Link
            href={team.repository_url}
            passHref
            referrerPolicy="no-referrer"
            target="_blank"
            title={team.repository_url}
          >
            <Text>Source Code</Text>
          </Link>
          {onEditRepository && (
            <Anchor
              component="button"
              size="sm"
              c="dimmed"
              onClick={onEditRepository}
            >
              Edit
            </Anchor>
          )}
        </Group>
      ) : onEditRepository ? (
        <Group gap="xs">
          <Text c="red" fw={600}>
            No code repository linked
          </Text>
          <Anchor component="button" onClick={onEditRepository}>
            Add Repository
          </Anchor>
        </Group>
      ) : (
        <Text c="dimmed">No code repository</Text>
      )}
    </IconTextGroup>
  );

  return (
    <Stack gap="sm">
      {teamLink}
      {projectLink}
      {ingressUrlLink}
      {repositoryLink}
    </Stack>
  );
};

export default TeamLinks;
