"use client";

import { useGetTeamRanking } from "@/api/gen";
import PageSkeleton from "@/components/PageSkeleton";
import TeamAffiliatesCard from "@/components/team/TeamAffiliatesCard";
import TeamBlogCard from "@/components/team/TeamBlogCard";
import TeamDetailsCard from "@/components/team/TeamDetailsCard";
import TeamMenu from "@/components/team/TeamMenu";
import TeamRepositoryModal from "@/components/team/TeamRepositoryModal";
import TeamFeedback from "@/components/team/feedback/TeamFeedback";
import { useResolveParams } from "@/hooks/useResolveParams";
import { badgeProps } from "@/styles/common";

import { Badge, Group, SimpleGrid, Stack, Title } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

const Team = () => {
  const { event, team, refetchTeam, policies } = useResolveParams();
  const [repositoryOpened, repositoryHandles] = useDisclosure();
  const { data: ranking } = useGetTeamRanking(team?.id ?? "", {
    query: {
      enabled: (!!team?.id && policies?.can_view_team_feedback) ?? false,
    },
  });

  if (!event || !team || !policies) {
    return <PageSkeleton />;
  }

  return (
    <Stack gap="xl">
      <Stack>
        <Group justify="space-between">
          <Group>
            <Title order={2}>{team.name}</Title>
            {team.finalist && <Badge {...badgeProps}>Finalist</Badge>}
          </Group>
          <TeamMenu
            team={team}
            refetchTeam={refetchTeam}
            policies={policies}
            onEditRepository={repositoryHandles.open}
          />
        </Group>
        <SimpleGrid
          cols={{ xs: 1, sm: policies.can_view_event_internal ? 2 : 1 }}
        >
          <TeamDetailsCard
            team={team}
            canViewProject={policies.can_view_project}
            canViewRepository={policies.can_view_team_blog}
            onEditRepository={
              policies.can_update_team_blog ? repositoryHandles.open : undefined
            }
          />
          {policies.can_view_event_internal && (
            <TeamAffiliatesCard teamId={team.id} />
          )}
        </SimpleGrid>

        {policies.can_view_team_blog && (
          <TeamBlogCard team={team} canUpdate={policies.can_update_team_blog} />
        )}
      </Stack>

      <TeamRepositoryModal
        team={team}
        refetchTeam={refetchTeam}
        opened={repositoryOpened}
        onClose={repositoryHandles.close}
      />

      {policies.can_view_team_feedback && ranking && (
        <TeamFeedback
          entry={ranking.team}
          maxTotalPoints={ranking.max_total_points}
        />
      )}
    </Stack>
  );
};

export default Team;
