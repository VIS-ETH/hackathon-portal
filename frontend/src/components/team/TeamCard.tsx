import IconTextGroup from "../IconTextGroup";
import LinkCard from "../LinkCard";

import { Team, TeamRole } from "@/api/gen/schemas";
import { fmtTeamIndex } from "@/utils";

import { Text } from "@mantine/core";

import { IconListDetails } from "@tabler/icons-react";

type TeamCardProps = {
  eventSlug: string;
  team: Team;
  roles: TeamRole[];
  projectName?: string;
  highlight?: boolean;
};

const TeamCard = ({
  eventSlug,
  team,
  roles,
  projectName,
  highlight,
}: TeamCardProps) => {
  return (
    <LinkCard
      href={`/events/${eventSlug}/teams/${team.slug}`}
      title={team.name}
      highlight={highlight}
      prefix={<Text ff="monospace">{fmtTeamIndex(team.index)}</Text>}
      detail={
        projectName && (
          <IconTextGroup Icon={IconListDetails}>
            <Text truncate>{projectName}</Text>
          </IconTextGroup>
        )
      }
      badges={[
        ...(team.finalist ? [{ label: "Finalist", mobile: true }] : []),
        ...roles.map((role) => ({ label: role })),
      ]}
    />
  );
};

export default TeamCard;
