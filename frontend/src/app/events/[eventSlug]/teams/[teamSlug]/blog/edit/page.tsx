"use client";

import { useGetTeamBlog } from "@/api/gen";
import PageSkeleton from "@/components/PageSkeleton";
import TeamBlogEditor from "@/components/team/TeamBlogEditor";
import { useResolveParams } from "@/hooks/useResolveParams";

import { Stack, Text, Title } from "@mantine/core";

import { useRouter } from "next/navigation";

const EditTeamBlog = () => {
  const router = useRouter();
  const { event, team, policies } = useResolveParams();
  const { data: sections, refetch: refetchSections } = useGetTeamBlog(
    team?.id ?? "",
    {
      query: {
        enabled: (!!team?.id && policies?.can_update_team_blog) ?? false,
      },
    },
  );

  if (!event || !team || !policies) {
    return <PageSkeleton />;
  }

  if (!policies.can_update_team_blog) {
    return (
      <Stack>
        <Title order={2}>Edit Blog</Title>
        <Text c="dimmed">
          The blog can only be edited by team members during the hacking phase.
        </Text>
      </Stack>
    );
  }

  if (!sections) {
    return <PageSkeleton />;
  }

  const handleSaved = async () => {
    await refetchSections();
    router.push(`/events/${event.slug}/teams/${team.slug}`);
  };

  return (
    <Stack>
      <Title order={2}>Edit Blog of {team.name}</Title>
      <TeamBlogEditor
        event={event}
        team={team}
        initialSections={sections}
        onSaved={handleSaved}
      />
    </Stack>
  );
};

export default EditTeamBlog;
