import AttemptsTableRow from "./AttemptsTableRow";
import CreateAttemptDrawer from "./CreateAttemptDrawer";

import {
  useGetEventAffiliates,
  useGetSidequestAttempts,
  useGetSidequests,
  useGetTeams,
} from "@/api/gen";
import { EventRole } from "@/api/gen/schemas";
import {
  cardProps,
  cardSectionProps,
  iconProps,
  inputProps,
  secondaryButtonProps,
} from "@/styles/common";

import { useState } from "react";

import {
  Button,
  Card,
  Group,
  Select,
  SelectProps,
  Stack,
  Table,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconPlus, IconRefresh } from "@tabler/icons-react";
import objectHash from "object-hash";

type AttemptsTableForSidequestMasterProps = {
  eventId: string;
};

const AttemptsTableForSidequestMaster = ({
  eventId,
}: AttemptsTableForSidequestMasterProps) => {
  const [createAttemptOpened, createAttemptHandles] = useDisclosure();
  const [sidequestFilter, setSidequestFilter] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);

  const { data: sidequests = [] } = useGetSidequests({
    event_id: eventId,
  });

  const { data: teams = [] } = useGetTeams({
    event_id: eventId,
  });

  const { data: participants = [] } = useGetEventAffiliates(eventId, {
    role: EventRole.Participant,
  });

  const { data: attempts = [], refetch: refetchAttempts } =
    useGetSidequestAttempts({
      event_id: eventId,
      sidequest_id: sidequestFilter,
      team_id: teamFilter,
      user_id: userFilter,
    });

  return (
    <Stack>
      <Group justify="end">
        <Button
          {...secondaryButtonProps}
          leftSection={<IconPlus {...iconProps} />}
          onClick={createAttemptHandles.open}
        >
          Create
        </Button>
      </Group>
      <Card {...cardProps}>
        <Card.Section {...cardSectionProps}>
          <Group>
            <Button
              {...secondaryButtonProps}
              size="sm"
              leftSection={<IconRefresh {...iconProps} />}
              onClick={() => {
                refetchAttempts();
              }}
            >
              Refresh
            </Button>
            <Select
              {...(inputProps as SelectProps)}
              size="sm"
              data={sidequests.map((sidequest) => ({
                label: sidequest.name,
                value: sidequest.id,
              }))}
              value={sidequestFilter}
              onChange={(value) => {
                setSidequestFilter(value);
                setTeamFilter(null);
                setUserFilter(null);
              }}
              placeholder="Filter by sidequest"
              searchable
              clearable
            />
            <Select
              {...(inputProps as SelectProps)}
              size="sm"
              data={teams.map((team) => ({
                label: team.name,
                value: team.id,
              }))}
              value={teamFilter}
              onChange={(value) => {
                setSidequestFilter(null);
                setTeamFilter(value);
                setUserFilter(null);
              }}
              placeholder="Filter by team"
              searchable
              clearable
            />
            <Select
              {...(inputProps as SelectProps)}
              size="sm"
              data={participants.map((participant) => ({
                label: participant.name,
                value: participant.id,
              }))}
              value={userFilter}
              onChange={(value) => {
                setSidequestFilter(null);
                setTeamFilter(null);
                setUserFilter(value);
              }}
              placeholder="Filter by user"
              searchable
              clearable
            />
          </Group>
        </Card.Section>
        <Card.Section>
          <Table.ScrollContainer minWidth={1000}>
            <Table striped layout="fixed">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Sidequest</Table.Th>
                  <Table.Th>Result</Table.Th>
                  <Table.Th>Day</Table.Th>
                  <Table.Th>Time</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {attempts.map((attempt) => (
                  <AttemptsTableRow
                    key={objectHash(attempt)}
                    eventId={eventId}
                    attempt={attempt}
                    withUserName
                    manage
                    refetch={refetchAttempts}
                  />
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card.Section>
      </Card>
      <CreateAttemptDrawer
        eventId={eventId}
        opened={createAttemptOpened}
        onClose={createAttemptHandles.close}
        refetch={refetchAttempts}
      />
    </Stack>
  );
};

export default AttemptsTableForSidequestMaster;
