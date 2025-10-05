import IconTextGroup from "../IconTextGroup";

import { useGetProject, useGetTeamAffiliates } from "@/api/gen";
import { Team, TeamRole } from "@/api/gen/schemas";
import { cardProps, cardSectionProps } from "@/styles/common";

import {
  Card,
  Center,
  Container,
  Group,
  Stack,
  Text,
  TextProps,
  Title,
} from "@mantine/core";

import { IconRocket, IconUser, IconUserStar } from "@tabler/icons-react";

type TeamAssignmentSlideProps = {
  team: Team;
};

const TeamAssignmentSlide = ({ team }: TeamAssignmentSlideProps) => {
  const { data: project } = useGetProject(team.project_id ?? "", {
    query: {
      enabled: !!team.project_id,
    },
  });

  const { data: affiliates = [] } = useGetTeamAffiliates(team.id);

  const mentors =
    affiliates.filter((a) => a.roles.includes(TeamRole.Mentor)) ?? [];
  const members =
    affiliates.filter((a) => a.roles.includes(TeamRole.Member)) ?? [];

  const textProps = { size: "lg" } satisfies TextProps;

  const projectSection = project && (
    <Card.Section {...cardSectionProps}>
      <Group justify="space-between">
        <IconTextGroup Icon={IconRocket}>Project</IconTextGroup>
        <Text {...textProps} fw="bold">
          {project.name}
        </Text>
      </Group>
    </Card.Section>
  );

  const mentorsSection = mentors.length > 0 && (
    <Card.Section {...cardSectionProps}>
      <Group justify="space-between" wrap="nowrap">
        <IconTextGroup Icon={IconUserStar}>
          {mentors.length > 1 ? "Mentors" : "Mentor"}
        </IconTextGroup>
        <Stack gap={0} ta="end">
          {mentors.map((m) => (
            <Text {...textProps} key={m.id} fw="bold">
              {m.name}
            </Text>
          ))}
        </Stack>
      </Group>
    </Card.Section>
  );

  const membersSection = members.length > 0 && (
    <Card.Section {...cardSectionProps}>
      <Group justify="space-between" wrap="nowrap">
        <IconTextGroup Icon={IconUser}>
          {members.length > 1 ? "Members" : "Member"}
        </IconTextGroup>
        <Stack gap={0} ta="end">
          {members.map((m) => (
            <Text {...textProps} key={m.id}>
              {m.name}
            </Text>
          ))}
        </Stack>
      </Group>
    </Card.Section>
  );

  return (
    <Container ta="center" h="100%">
      <Center h="100%">
        <Stack gap={50} align="center">
          <Title>{team.name}</Title>
          {(projectSection || mentorsSection || membersSection) && (
            <Card {...cardProps} w={500}>
              {projectSection}
              {mentorsSection}
              {membersSection}
            </Card>
          )}
        </Stack>
      </Center>
    </Container>
  );
};

export default TeamAssignmentSlide;
