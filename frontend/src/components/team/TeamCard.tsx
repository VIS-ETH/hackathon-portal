import IconTextGroup from "../IconTextGroup";
import LinkCard from "../LinkCard";

import {
  useGetEvent,
  useGetMyPolicies,
  useGetProjects,
  useGetTeamsRoles,
} from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { fmtTeamIndex } from "@/utils";

import { Text } from "@mantine/core";

import { IconListDetails } from "@tabler/icons-react";

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
    <LinkCard
      href={`/events/${event?.slug}/teams/${team.slug}`}
      title={team.name}
      highlight={highlight}
      prefix={<Text ff="mono">{fmtTeamIndex(team.index)}</Text>}
      detail={
        projectName && (
          <IconTextGroup Icon={IconListDetails}>
            <Text truncate>{projectName}</Text>
          </IconTextGroup>
        )
      }
      badges={[
        ...(team.finalist ? [{ label: "Finalist", mobile: true }] : []),
        ...teamRoles.map((role) => ({ label: role })),
      ]}
    />
  );
};

export default TeamCard;
