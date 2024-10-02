import {
  Team,
  useDeleteTeamRoles,
  useGetProject,
  useGetTeamAffiliates,
  useGetTeamRoles,
} from "@/api/gen";

import { useEffect, useState } from "react";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Flex,
  Group,
  NumberFormatter,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import {
  IconLink,
  IconListDetails,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const ProjectInfo = ({ project_id }: { project_id: string }) => {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const router = useRouter();
  const { data: project } = useGetProject(project_id);
  return (
    <Group>
      <Text>{project?.name}</Text>
      <ActionIcon
        size={"sm"}
        variant="transparent"
        onClick={() => router.push(`/${eventSlug}/participant/projects`)}
      >
        <IconLink />
      </ActionIcon>
    </Group>
  );
};

type TeamProps = {
  team: Team;
};

export default function TeamOverview({ team }: TeamProps) {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { data: affiliates } = useGetTeamAffiliates(team.id);
  const { data: my_team_roles } = useGetTeamRoles(team.id);
  const [mentors, setMentors] = useState<string[]>([]);

  useEffect(() => {
    if (affiliates) {
      setMentors(
        affiliates
          .filter((person) => person.roles.includes("Mentor"))
          .map((person) => person.name),
      );
    }
  }, [affiliates]);

  const remove_team = useDeleteTeamRoles(team.id);
  const router = useRouter();
  const is_your_team = my_team_roles && my_team_roles.includes("Member");

  return (
    <Link
      href={`/${eventSlug}/participant/team/${team.slug}`}
      style={{ textDecoration: "none" }}
    >
      <Card withBorder mb={"md"}>
        <Stack>
          <Flex justify={"space-between"} align={"center"}>
            <Group>
              <Badge variant="outline">
                <Text c="dimmed">
                  #{team.index.toString().padStart(2, "0")}
                </Text>
              </Badge>
              <Title order={3}>{team.name}</Title>
              {my_team_roles && my_team_roles.includes("Member") && (
                <Badge variant="filled">Your Team</Badge>
              )}
              {my_team_roles && my_team_roles.includes("Mentor") && (
                <Badge variant="filled">Mentoring</Badge>
              )}
            </Group>
            {affiliates && (
              <Group>
                <IconUsers size={24} />
                <Text c="dimmed" size="sm">
                  {affiliates.length}
                </Text>
              </Group>
            )}
          </Flex>
          <Divider />
          <Group align="center">
            <IconListDetails />{" "}
            {team.project_id ? (
              <ProjectInfo project_id={team.project_id} />
            ) : (
              <Text c={"dimmed"}>No project yet</Text>
            )}
          </Group>
          {mentors.length > 0 && (
            <Group>
              <IconUser />
              <Text>Mentor: {mentors.join(", ")}</Text>
            </Group>
          )}
          {affiliates && (
            <Group>
              <IconUsers />
              <Flex wrap={"wrap"}>
                <Text>
                  {affiliates.map((person) => person.name).join(", ")}
                </Text>
              </Flex>
            </Group>
          )}
          {is_your_team && (
            <Flex justify={"end"}>
              <Link href={`/${eventSlug}/participant/team/${team.slug}`}>
                <Button>Details</Button>
              </Link>
            </Flex>
          )}
        </Stack>
      </Card>
    </Link>
  );
}
