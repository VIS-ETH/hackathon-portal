"use client";

import { useGetProject } from "@/api/gen";
import PageSkeleton from "@/components/PageSkeleton";
import ExpertRatingCard from "@/components/team/ExpertRatingCard";
import TeamAffiliatesCard from "@/components/team/TeamAffiliatesCard";
import TeamDetailsCard from "@/components/team/TeamDetailsCard";
import { useResolveParams } from "@/hooks/useResolveParams";

import { SimpleGrid, Stack, Title } from "@mantine/core";

const Team = () => {
  const { event, team, policies } = useResolveParams();
  const { data: project } = useGetProject(team?.project_id ?? "");

  if (!event || !team || !policies) {
    return <PageSkeleton />;
  }

  return (
    <Stack>
      <Title order={2}>{team.name}</Title>
      <SimpleGrid
        cols={{ xs: 1, sm: policies.can_view_event_internal ? 2 : 1 }}
      >
        <TeamDetailsCard
          team={team}
          canViewPassword={policies.can_view_team_confidential}
        />
        {policies.can_view_event_internal && (
          <TeamAffiliatesCard teamId={team.id} />
        )}
      </SimpleGrid>
      {policies.can_manage_expert_rating && (
        <ExpertRatingCard teamId={team.id} project={project} />
      )}
      {policies.can_view_team_feedback && (
        <ExpertRatingCard teamId={team.id} feedbackOnly />
      )}
    </Stack>
  );
};

export default Team;
