import TeamImage from "../team/TeamImage";

import { useGetProject } from "@/api/gen";
import { Team as TeamType } from "@/api/gen/schemas";
import { fmtTeamIndex } from "@/utils";

import { Card, Group, Text } from "@mantine/core";

type TeamSelectCardProps = {
  team: TeamType;
};

const TeamSelectCard = ({ team }: TeamSelectCardProps) => {
  const { data: project } = useGetProject(team.project_id ?? "");

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <TeamImage
          url={team.photo_url || ""}
          height={"160"}
          alt={team.name}
          fit="contain"
          width={"100%"}
        />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Group>
          <Text ff="mono">{fmtTeamIndex(team.index)}</Text>
          <Text fw={500}>{team.name}</Text>
        </Group>
        <Text>{project?.name}</Text>
      </Group>
    </Card>
  );
};

export default TeamSelectCard;
