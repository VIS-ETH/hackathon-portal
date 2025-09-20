import IconTextGroup from "../IconTextGroup";

import { useGetEvent, useGetProject, useGetTeamCredentials } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { cardProps, iconProps, secondaryButtonProps } from "@/styles/common";
import { fmtTeamIndex } from "@/utils";

import { Button, Card, CopyButton, Group, Stack, Text } from "@mantine/core";

import {
  IconKey,
  IconListDetails,
  IconSettings,
  IconWorld,
  IconWorldCode,
} from "@tabler/icons-react";
import Link from "next/link";

type TeamDetailsCardProps = {
  team: Team;
  canViewPassword: boolean;
};

const TeamDetailsCard = ({ team, canViewPassword }: TeamDetailsCardProps) => {
  const { data: event } = useGetEvent(team.event_id);
  const { data: project } = useGetProject(team?.project_id ?? "");

  const { data: credentials } = useGetTeamCredentials(team?.id ?? "", {
    query: {
      enabled: !!team && canViewPassword,
    },
  });

  const publicUrl = `${fmtTeamIndex(team.index)}.viscon-hackathon.ch`;
  const directUrl = `${fmtTeamIndex(team.index)}-direct.viscon-hackathon.ch`;

  const sshConfig = `Host viscon-${fmtTeamIndex(team.index)}\n  HostName ${directUrl}\n  User viscon`;

  const projectLink = event && project && (
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

  const publicUrlLink = (
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

  const directUrlLink = (
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
          {copied ? "Copied" : "Copy SSH Config"}
        </Button>
      )}
    </CopyButton>
  );

  const copyPasswordButton = credentials?.vm_password && (
    <CopyButton value={credentials.vm_password}>
      {({ copied, copy }) => (
        <Button
          {...secondaryButtonProps}
          variant="light"
          leftSection={<IconKey {...iconProps} />}
          onClick={copy}
        >
          {copied ? "Copied" : "Copy VM Password"}
        </Button>
      )}
    </CopyButton>
  );
  const copyAIKeyButton = credentials?.ai_api_key && (
    <CopyButton value={credentials.ai_api_key}>
      {({ copied, copy }) => (
        <Button
          {...secondaryButtonProps}
          variant="light"
          leftSection={<IconKey {...iconProps} />}
          onClick={copy}
        >
          {copied ? "Copied" : "Copy AI Key"}
        </Button>
      )}
    </CopyButton>
  );

  const password =
    canViewPassword && (credentials?.vm_password || credentials?.ai_api_key);

  return (
    <Card {...cardProps}>
      <Stack gap="sm" justify="space-between" h="100%">
        <Stack gap="sm">
          {projectLink}
          {publicUrlLink}
          {directUrlLink}
        </Stack>
        {password && (
          <Group grow>
            {copyConfigButton}
            {copyPasswordButton}
            {copyAIKeyButton}
          </Group>
        )}
      </Stack>
    </Card>
  );
};

export default TeamDetailsCard;
