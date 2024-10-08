"use client";

import MarkdownCard from "@/components/MarkdownCard";
import PageSkeleton from "@/components/PageSkeleton";
import { useResolveParams } from "@/hooks/useResolveParams";

import { Stack, Text, Title } from "@mantine/core";

const Documentation = () => {
  const { event } = useResolveParams();

  if (!event) {
    return <PageSkeleton />;
  }

  return (
    <Stack>
      <Title order={2}>Documentation</Title>
      {event.documentation_content ? (
        <MarkdownCard content={event.documentation_content} />
      ) : (
        <Text>No documentation available.</Text>
      )}
    </Stack>
  );
};

export default Documentation;
