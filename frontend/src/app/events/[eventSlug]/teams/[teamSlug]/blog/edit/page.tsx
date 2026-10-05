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
  const { data: blog } = useGetTeamBlog(team?.id ?? "", {
    query: {
      enabled: (!!team?.id && policies?.can_update_team_blog) ?? false,
      // The editor warns about concurrent edits as soon as a newer version is fetched.
      refetchInterval: 30 * 1000,
    },
  });

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

  if (!blog) {
    return <PageSkeleton />;
  }

  const handleSaved = () => {
    router.push(`/events/${event.slug}/teams/${team.slug}`);
  };

  return (
    <Stack>
      <Title order={2}>Edit Blog of {team.name}</Title>
      <TeamBlogEditor
        event={event}
        team={team}
        blog={blog}
        onSaved={handleSaved}
      />
    </Stack>
  );
};

export default EditTeamBlog;
