"use client";

import {
  Project,
  Team,
  useGetEvent,
  useGetProject,
  useGetProjects,
  useGetTeam,
  useGetTeamAffiliates,
  useGetTeamBySlug,
  useGetTeamPassword,
  useGetTeamProjectPreferences,
  useUpdateTeamProjectPreferences,
} from "@/api/gen";
import MyCopyButton from "@/componentes/CopyButton";

import { useEffect, useState } from "react";
import Markdown from "react-markdown";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Collapse,
  ComboboxItem,
  Container,
  Divider,
  Flex,
  Grid,
  Group,
  List,
  Modal,
  Select,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import {
  IconLink,
  IconListDetails,
  IconNumber0,
  IconNumber1,
  IconNumber2,
  IconNumber3,
} from "@tabler/icons-react";
import { skipToken } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

const VMInfo = ({ team }: { team: Team }) => {
  const { data: team_secret } = useGetTeamPassword(team.id);

  return (
    <>
      <Title order={2}>VM</Title>
      <Grid>
        <Grid.Col span={2}>Domain</Grid.Col>
        <Grid.Col span={10}>
          <Badge variant="outline">
            <Group>
              {team.index.toString().padStart(2, "0")}.viscon-hackathon.ch
              <MyCopyButton
                text={`${team.index.toString().padStart(2, "0")}.viscon-hackathon.ch`}
              />
            </Group>
          </Badge>
        </Grid.Col>
        <Grid.Col span={2}>Credentials</Grid.Col>
        <Grid.Col span={10}>
          <Text>
            ubuntu:
            {team_secret && team_secret.password ? team_secret.password : "???"}
          </Text>
        </Grid.Col>
      </Grid>
    </>
  );
};

const ProjectInfo = ({ team }: { team: Team }) => {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const [opened, { toggle }] = useDisclosure(false);

  const { data: project } = useGetProject(team.project_id ?? "", {
    query: { enabled: !!team.project_id },
  });
  const { data: affiliates } = useGetTeamAffiliates(team.id);
  const router = useRouter();
  const mentors = affiliates?.filter((person) =>
    person.roles.includes("Mentor"),
  );

  return (
    <>
      <Title order={2}>Project</Title>
      {team.project_id && project ? (
        <Stack>
          <Flex align={"center"} justify={"space-between"}>
            <Text>{project?.name}</Text>
            <Group justify="center" mb={5}>
              <Button onClick={toggle}>Project Details</Button>
            </Group>
          </Flex>
          {mentors &&
            mentors.length > 0 &&
            mentors.map((mentor) => {
              return (
                <Group gap={"xs"}>
                  <Text>Mentor:</Text>
                  <Text>{mentor.name}</Text>
                </Group>
              );
            })}

          <Collapse in={opened}>
            <Card withBorder>
              <Stack m={"xl"}>
                {/* <Title order={3}>{project.name}</Title> */}
                <Container unstyled>
                  <Markdown>{project.content}</Markdown>
                </Container>
              </Stack>
            </Card>
          </Collapse>
        </Stack>
      ) : (
        <Text>No project assignment yet.</Text>
      )}
    </>
  );
};

export default function Page() {
  const { eventSlug, teamSlug } = useParams<{
    eventSlug: string;
    teamSlug: string;
  }>();
  const { data: team } = useGetTeamBySlug(eventSlug, teamSlug);

  if (!team) {
    return <Text>Team not found</Text>;
  }

  return (
    <Stack>
      <VMInfo team={team} />
      <Divider />
      <ProjectInfo team={team} />
      <Divider />
    </Stack>
  );
}
