"use client";

import { useGetTeamRanking, useGetTeamSecrets } from "@/api/gen";
import PageSkeleton from "@/components/PageSkeleton";
import AccessDetailsCard from "@/components/team/AccessDetailsCard";
import NetworkConfigModal from "@/components/team/NetworkConfigModal";
import TeamAffiliatesCard from "@/components/team/TeamAffiliatesCard";
import TeamBlogCard from "@/components/team/TeamBlogCard";
import TeamDetailsCard from "@/components/team/TeamDetailsCard";
import TeamRepositoryModal from "@/components/team/TeamRepositoryModal";
import TeamSecretsCard from "@/components/team/TeamSecretsCard";
import TeamFeedback from "@/components/team/feedback/TeamFeedback";
import { useResolveParams } from "@/hooks/useResolveParams";
import { badgeProps, iconProps, secondaryButtonProps } from "@/styles/common";

import { Badge, Button, Group, SimpleGrid, Stack, Title } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconNetwork } from "@tabler/icons-react";

const Team = () => {
  const { event, team, refetchTeam, policies } = useResolveParams();
  const [repositoryOpened, repositoryHandles] = useDisclosure();
  const [networkConfigOpened, networkConfigHandles] = useDisclosure();
  const { data: ranking } = useGetTeamRanking(team?.id ?? "", {
    query: {
      enabled: (!!team?.id && policies?.can_view_team_feedback) ?? false,
    },
  });

  const { data: secrets = [] } = useGetTeamSecrets(team?.id ?? "", {
    query: {
      enabled: (!!team?.id && policies?.can_view_team_confidential) ?? false,
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
          {/* Others reach it from the access details card below. */}
          {policies.can_update_team_ingress_config &&
            !policies.can_view_team_confidential && (
              <Button
                {...secondaryButtonProps}
                leftSection={<IconNetwork {...iconProps} />}
                onClick={networkConfigHandles.open}
              >
                Edit Network Configuration
              </Button>
            )}
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
            refetchTeam={
              policies.can_update_team_photo ? refetchTeam : undefined
            }
          />
          {policies.can_view_event_internal && (
            <TeamAffiliatesCard teamId={team.id} />
          )}
        </SimpleGrid>

        {policies.can_view_team_confidential && (
          <SimpleGrid cols={{ xs: 1, sm: secrets.length ? 2 : 1 }}>
            <AccessDetailsCard
              team={team}
              onEditNetwork={
                policies.can_update_team_ingress_config
                  ? networkConfigHandles.open
                  : undefined
              }
            />
            {secrets.length > 0 && <TeamSecretsCard secrets={secrets} />}
          </SimpleGrid>
        )}

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
      <NetworkConfigModal
        team={team}
        opened={networkConfigOpened}
        onClose={networkConfigHandles.close}
        refetch={refetchTeam}
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
