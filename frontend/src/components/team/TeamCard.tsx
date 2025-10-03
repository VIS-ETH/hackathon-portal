import IconTextGroup from "../IconTextGroup";

import {
  useGetEvent,
  useGetMyPolicies,
  useGetProjects,
  useGetTeamsRoles,
} from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import {
  badgeProps,
  cardProps,
  highlightedCardProps,
  iconProps,
} from "@/styles/common";
import { fmtTeamIndex } from "@/utils";

import { Badge, Card, Grid, Group, Text } from "@mantine/core";

import { IconChevronRight, IconListDetails } from "@tabler/icons-react";
import Link from "next/link";

type TeamCardProps = {
  team: Team;
  highlight?: boolean;
};

const TeamCard = ({ team, highlight }: TeamCardProps) => {
  const { data: policies } = useGetMyPolicies({
    event_id: team.event_id,
  });

  const { data: event } = useGetEvent(team.event_id);
  const { data: teamsRoles } = useGetTeamsRoles({ event_id: team.event_id });
  const { data: projects } = useGetProjects(
    { event_id: team.event_id },
    {
      query: { enabled: policies?.can_view_project },
    },
  );

  const teamRoles = teamsRoles?.[team.id] ?? [];
  const projectName = projects?.find(
    (project) => project.id === team.project_id,
  )?.name;

  return (
    <Link href={`/events/${event?.slug}/teams/${team.slug}`}>
      <Card {...(highlight ? highlightedCardProps : cardProps)}>
        <Grid align="center">
          <Grid.Col component={Group} span="auto">
            <Text ff="mono">{fmtTeamIndex(team.index)}</Text>
            <Text fw={600}>{team.name}</Text>
          </Grid.Col>
          {projectName && (
            <Grid.Col span="auto" visibleFrom="sm">
              <IconTextGroup Icon={IconListDetails}>
                <Text>{projectName}</Text>
              </IconTextGroup>
            </Grid.Col>
          )}
          <Grid.Col span={3}>
            <Group justify="end">
              {teamRoles &&
                teamRoles.map((role) => (
                  <Badge key={role} {...badgeProps} visibleFrom="xs">
                    {role}
                  </Badge>
                ))}
              <IconChevronRight {...iconProps} />
            </Group>
          </Grid.Col>
        </Grid>
      </Card>
    </Link>
  );
};

export default TeamCard;
