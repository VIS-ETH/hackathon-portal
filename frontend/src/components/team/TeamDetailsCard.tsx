"use client";

import IconTextGroup from "../IconTextGroup";

import { useGetEvent, useGetProject } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { cardProps, cardSectionProps } from "@/styles/common";

import { Card, Image, Stack, Text } from "@mantine/core";

import { IconListDetails, IconWorld } from "@tabler/icons-react";
import Link from "next/link";

type TeamDetailsCardProps = {
  team: Team;
  canViewProject: boolean;
};

const TeamDetailsCard = ({ team, canViewProject }: TeamDetailsCardProps) => {
  const { data: event } = useGetEvent(team.event_id);
  const { data: project } = useGetProject(team?.project_id ?? "", {
    query: { enabled: !!team?.project_id && canViewProject },
  });

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
    <Card {...cardProps}>
      {team.photo_url && (
        <Card.Section {...cardSectionProps} p={0}>
          <Image
            src={team.photo_url}
            alt="Team Photo"
            w="100%"
            mah={400}
            fit="cover"
          />
        </Card.Section>
      )}
      <Card.Section {...cardSectionProps}>
        <Stack gap="sm" justify="space-between" h="100%">
          <Stack gap="sm">
            {projectLink}
            {ingressUrlLink}
          </Stack>
        </Stack>
      </Card.Section>
    </Card>
  );
};

export default TeamDetailsCard;
