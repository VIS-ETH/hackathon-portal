"use client";

import { useGetTeamRating } from "@/api/gen";
import PageSkeleton from "@/components/PageSkeleton";
import RatingFeedbackCard from "@/components/team/RatingFeedbackCard";
import TeamAffiliatesCard from "@/components/team/TeamAffiliatesCard";
import TeamDetailsCard from "@/components/team/TeamDetailsCard";
import TeamMenu from "@/components/team/TeamMenu";
import { useResolveParams } from "@/hooks/useResolveParams";
import { badgeProps } from "@/styles/common";

import { Badge, Group, SimpleGrid, Stack, Title } from "@mantine/core";

const Team = () => {
  const { event, team, refetchTeam, policies } = useResolveParams();
  const { data: rating } = useGetTeamRating(team?.id ?? "", {
    query: {
      enabled: (!!team?.id && policies?.can_view_team_feedback) ?? false,
    },
  });

  if (!event || !team || !policies) {
    return <PageSkeleton />;
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <Title order={2}>{team.name}</Title>
          {team.finalist && <Badge {...badgeProps}>Finalist</Badge>}
        </Group>
        <TeamMenu team={team} refetchTeam={refetchTeam} policies={policies} />
      </Group>
      <SimpleGrid
        cols={{ xs: 1, sm: policies.can_view_event_internal ? 2 : 1 }}
      >
        <TeamDetailsCard
          team={team}
          canViewProject={policies.can_view_project}
        />
        {policies.can_view_event_internal && (
          <TeamAffiliatesCard teamId={team.id} />
        )}
      </SimpleGrid>

      {policies.can_view_team_feedback && rating && (
        <RatingFeedbackCard rating={rating} limitedView={false} />
      )}
    </Stack>
  );
};

export default Team;
