"use client";

import {
  useGetProject,
  useGetTeamAffiliates,
  useGetTeamPassword,
} from "@/api/gen";
import { TeamRole } from "@/api/gen/schemas";
import IconTextGroup from "@/components/IconTextGroup";
import PageSkeleton from "@/components/PageSkeleton";
import { useResolveParams } from "@/hooks/useResolveParams";
import {
  cardProps,
  cardSectionProps,
  iconProps,
  secondaryButtonProps,
} from "@/styles/common";
import { fmtTeamIndex } from "@/utils";

import {
  Button,
  Card,
  CardSection,
  CopyButton,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import {
  IconKey,
  IconListDetails,
  IconSettings,
  IconUser,
  IconUserStar,
  IconWorld,
  IconWorldCode,
} from "@tabler/icons-react";
import Link from "next/link";

const Team = () => {
  const { event, team, policies } = useResolveParams();
  const { data: project } = useGetProject(team?.project_id ?? "");

  const { data: affiliates } = useGetTeamAffiliates(team?.id ?? "", undefined, {
    query: {
      enabled: !!team && policies?.can_view_event_internal,
    },
  });

  const { data: password } = useGetTeamPassword(team?.id ?? "", {
    query: {
      enabled: !!team && policies?.can_view_team_confidential,
    },
  });

  if (!event || !team || !policies) {
    return <PageSkeleton />;
  }

  const publicUrl = `${fmtTeamIndex(team.index)}.viscon-hackathon.ch`;
  const directUrl = `${fmtTeamIndex(team.index)}-direct.viscon-hackathon.ch`;

  const sshConfig = `Host viscon-${fmtTeamIndex(team.index)}\n  HostName ${directUrl}\n  User ubuntu`;

  const members = affiliates?.filter((affiliate) =>
    affiliate.roles.includes(TeamRole.Member),
  );

  const mentors = affiliates?.filter((affiliate) =>
    affiliate.roles.includes(TeamRole.Mentor),
  );

  const projectElement = project && (
    <IconTextGroup Icon={IconListDetails}>
      <Link
        href={`/events/${event.slug}/projects/${project.slug}`}
        passHref
        referrerPolicy="no-referrer"
      >
        <Text>{project.name}</Text>
      </Link>
    </IconTextGroup>
  );

  const publicUrlElement = (
    <IconTextGroup Icon={IconWorld}>
      <Link
        href={`https://${publicUrl}`}
        passHref
        referrerPolicy="no-referrer"
        target="_blank"
      >
        <Text>{publicUrl}</Text>
      </Link>
    </IconTextGroup>
  );

  const directUrlElement = (
    <IconTextGroup Icon={IconWorldCode}>
      <Link
        href={`http://${directUrl}`}
        passHref
        referrerPolicy="no-referrer"
        target="_blank"
      >
        <Text>{directUrl}</Text>
      </Link>
    </IconTextGroup>
  );

  const copyConfigButton = (
    <CopyButton value={sshConfig}>
      {({ copied, copy }) => (
        <Button
          {...secondaryButtonProps}
          variant="light"
          leftSection={<IconSettings {...iconProps} />}
          onClick={copy}
        >
          {copied ? "Copied SSH Config" : "Copy SSH Config"}
        </Button>
      )}
    </CopyButton>
  );

  const copyPasswordButton = password?.password && (
    <CopyButton value={password.password}>
      {({ copied, copy }) => (
        <Button
          {...secondaryButtonProps}
          variant="light"
          leftSection={<IconKey {...iconProps} />}
          onClick={copy}
        >
          {copied ? "Copied VM Password" : "Copy VM Password"}
        </Button>
      )}
    </CopyButton>
  );

  return (
    <Stack>
      <Title order={2}>{team.name}</Title>
      <SimpleGrid cols={{ xs: 1, sm: affiliates ? 2 : 1 }}>
        <Card {...cardProps}>
          <Stack gap="sm">
            {projectElement}
            {publicUrlElement}
            {directUrlElement}
            {policies.can_view_team_confidential && (
              <Group grow>
                {copyConfigButton}
                {copyPasswordButton}
              </Group>
            )}
          </Stack>
        </Card>
        {members && mentors && (
          <Card {...cardProps}>
            <CardSection {...cardSectionProps}>
              <Stack gap="sm">
                {members.length ? (
                  members.map((member) => (
                    <IconTextGroup key={member.id} Icon={IconUser}>
                      <Text>{member.name}</Text>
                    </IconTextGroup>
                  ))
                ) : (
                  <Text c="dimmed">No members assigned</Text>
                )}
              </Stack>
            </CardSection>
            <CardSection {...cardSectionProps}>
              <Stack gap="sm">
                {mentors.length ? (
                  mentors.map((mentor) => (
                    <IconTextGroup key={mentor.id} Icon={IconUserStar}>
                      <Text>{mentor.name}</Text>
                    </IconTextGroup>
                  ))
                ) : (
                  <Text c="dimmed">No mentors assigned</Text>
                )}
              </Stack>
            </CardSection>
          </Card>
        )}
      </SimpleGrid>
    </Stack>
  );
};

export default Team;
