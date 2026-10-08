import TeamImage from "./TeamImage";
import TeamLinks from "./TeamLinks";

import { Team } from "@/api/gen/schemas";

import { Flex } from "@mantine/core";

type TeamDetailsProps = {
  team: Team;
  canViewProject: boolean;
  teamPage?: boolean;
  canViewRepository?: boolean;
};

const TeamDetails = ({
  team,
  canViewProject,
  teamPage,
  canViewRepository,
}: TeamDetailsProps) => {
  return (
    <Flex direction={{ base: "column", sm: "row" }} gap="md">
      <TeamImage
        url={team.photo_url}
        width={{ base: "100%", sm: 240 }}
        alt="Team Photo"
        radius="md"
      />
      <TeamLinks
        team={team}
        canViewProject={canViewProject}
        teamPage={teamPage}
        canViewRepository={canViewRepository}
      />
    </Flex>
  );
};

export default TeamDetails;
