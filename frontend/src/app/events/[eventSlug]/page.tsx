"use client";

import { useGetEventRoles } from "@/api/gen";
import MarkdownCard from "@/components/MarkdownCard";
import PageSkeleton from "@/components/PageSkeleton";
import { useResolveParams } from "@/hooks/useResolveParams";
import { badgeProps } from "@/styles/common";

import { Badge, Group, Stack, Title } from "@mantine/core";

const Overview = () => {
  const { event } = useResolveParams();
  const { data: roles } = useGetEventRoles(event?.id ?? "");

  if (!event) {
    return <PageSkeleton />;
  }

  return (
    <Stack>
      <Stack gap="xs">
        <Title order={2}>{event.name}</Title>
        <Group gap="xs">
          {roles?.map((role) => (
            <Badge key={role} {...badgeProps}>
              {role}
            </Badge>
          ))}
        </Group>
      </Stack>
      {event.welcome_content && (
        <MarkdownCard content={event.welcome_content} allowHtml={true} />
      )}
    </Stack>
  );
};

export default Overview;
