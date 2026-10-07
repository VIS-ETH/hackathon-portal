"use client";

import IconTextGroup from "../IconTextGroup";
import TeamImage from "./TeamImage";

import { useGetEvent, useGetProject } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { cardProps, cardSectionProps } from "@/styles/common";

import { Card, Flex, Stack, Text } from "@mantine/core";

import { IconListDetails, IconWorld } from "@tabler/icons-react";
import Link from "next/link";

type TeamDetailsCardProps = {
  team: Team;
  canViewProject: boolean;
  // the photo beside the details instead of above them (from sm up)
  horizontal?: boolean;
};

const TeamDetailsCard = ({
  team,
  canViewProject,
  horizontal,
}: TeamDetailsCardProps) => {
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

  const links = (
    <Stack gap="sm">
      {projectLink}
      {ingressUrlLink}
    </Stack>
  );

  if (horizontal) {
    return (
      <Card {...cardProps}>
        <Card.Section {...cardSectionProps}>
          <Flex direction={{ base: "column", sm: "row" }} gap="md">
            <TeamImage
              url={team.photo_url}
              width={{ base: "100%", sm: 240 }}
              alt="Team Photo"
              radius="md"
            />
            {links}
          </Flex>
        </Card.Section>
      </Card>
    );
  }

  return (
    <Card {...cardProps}>
      {team.photo_url && (
        <Card.Section withBorder>
          <TeamImage url={team.photo_url} alt="Team Photo" />
        </Card.Section>
      )}

      <Card.Section {...cardSectionProps}>{links}</Card.Section>
    </Card>
  );
};

export default TeamDetailsCard;
