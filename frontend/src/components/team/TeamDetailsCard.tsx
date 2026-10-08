import EditableTeamPhoto from "./EditableTeamPhoto";
import TeamDetails from "./TeamDetails";
import TeamImage from "./TeamImage";
import TeamLinks from "./TeamLinks";

import { Team } from "@/api/gen/schemas";
import { cardProps, cardSectionProps } from "@/styles/common";

import { Card } from "@mantine/core";

type TeamDetailsCardProps = {
  team: Team;
  canViewProject: boolean;
  canViewRepository?: boolean;
  onEditRepository?: () => void;
  // given if the photo may be uploaded or deleted
  refetchTeam?: () => void;
  // the photo beside the details instead of above them (from sm up)
  horizontal?: boolean;
};

const TeamDetailsCard = ({
  team,
  canViewProject,
  canViewRepository,
  onEditRepository,
  refetchTeam,
  horizontal,
}: TeamDetailsCardProps) => {
  if (horizontal) {
    return (
      <Card {...cardProps}>
        <Card.Section {...cardSectionProps}>
          <TeamDetails
            team={team}
            canViewProject={canViewProject}
            canViewRepository={canViewRepository}
          />
        </Card.Section>
      </Card>
    );
  }

  return (
    <Card {...cardProps}>
      {refetchTeam ? (
        <Card.Section withBorder>
          <EditableTeamPhoto team={team} refetchTeam={refetchTeam} />
        </Card.Section>
      ) : (
        team.photo_url && (
          <Card.Section withBorder>
            <TeamImage url={team.photo_url} alt="Team Photo" />
          </Card.Section>
        )
      )}

      <Card.Section {...cardSectionProps}>
        <TeamLinks
          team={team}
          canViewProject={canViewProject}
          canViewRepository={canViewRepository}
          onEditRepository={onEditRepository}
        />
      </Card.Section>
    </Card>
  );
};

export default TeamDetailsCard;
