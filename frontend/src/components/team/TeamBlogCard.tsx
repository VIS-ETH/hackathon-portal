import TeamBlogSection from "./TeamBlogSection";

import { useGetEvent, useGetTeamBlog } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import {
  cardHeaderSectionProps,
  cardHeaderTextProps,
  cardProps,
  cardSectionProps,
  iconProps,
  secondaryButtonProps,
} from "@/styles/common";

import { Button, Card, Group, Stack, Text } from "@mantine/core";

import { IconPencil } from "@tabler/icons-react";
import Link from "next/link";

type TeamBlogCardProps = {
  team: Team;
  canUpdate: boolean;
};

const TeamBlogCard = ({ team, canUpdate }: TeamBlogCardProps) => {
  const { data: event } = useGetEvent(team.event_id);
  const { data: sections = [] } = useGetTeamBlog(team.id);

  if (sections.length === 0 && !canUpdate) {
    return undefined;
  }

  return (
    <Card {...cardProps}>
      <Card.Section {...cardHeaderSectionProps}>
        <Group justify="space-between">
          <Text {...cardHeaderTextProps}>Blog</Text>
          {canUpdate && event && (
            <Button
              {...secondaryButtonProps}
              component={Link}
              href={`/events/${event.slug}/teams/${team.slug}/blog/edit`}
              leftSection={<IconPencil {...iconProps} />}
            >
              Edit Blog
            </Button>
          )}
        </Group>
      </Card.Section>
      <Card.Section {...cardSectionProps} withBorder={false}>
        {sections.length > 0 ? (
          <Stack gap="xl">
            {sections.map((section, index) => (
              <TeamBlogSection
                key={index}
                content={section.content}
                layout={section.layout}
                imageUrl={section.image_url}
              />
            ))}
          </Stack>
        ) : (
          <Text c="dimmed">
            Your team has not written a blog yet. Other teams can read it once
            the hacking phase is over.
          </Text>
        )}
      </Card.Section>
    </Card>
  );
};

export default TeamBlogCard;
