import NoEntriesTr from "../NoEntriesTr";
import EventAffiliateSelect from "../select/EventAffiliateSelect";
import SidequestSelect from "../select/SidequestSelect";
import TeamSelect from "../select/TeamSelect";
import AttemptsTableRow from "./AttemptsTableRow";
import CreateAttemptDrawer from "./CreateAttemptDrawer";

import { useGetSidequestAttempts } from "@/api/gen";
import { EventAffiliate, EventRole, Sidequest, Team } from "@/api/gen/schemas";
import {
  cardProps,
  cardSectionProps,
  iconProps,
  secondaryButtonProps,
} from "@/styles/common";

import { useState } from "react";

import { Button, Card, Group, Stack, Table } from "@mantine/core";

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

  const [sidequestFilter, setSidequestFilter] = useState<
    Sidequest | undefined
  >();
  const [teamFilter, setTeamFilter] = useState<Team | undefined>();
  const [userFilter, setUserFilter] = useState<EventAffiliate | undefined>();

  const { data: attempts = [], refetch: refetchAttempts } =
    useGetSidequestAttempts({
      event_id: eventId,
      sidequest_id: sidequestFilter?.id,
      team_id: teamFilter?.id,
      user_id: userFilter?.id,
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
            <SidequestSelect
              eventId={eventId}
              sidequestId={sidequestFilter?.id}
              setSidequest={(sidequest) => {
                setSidequestFilter(sidequest);
                setTeamFilter(undefined);
                setUserFilter(undefined);
              }}
              size="sm"
            />
            <TeamSelect
              eventId={eventId}
              teamId={teamFilter?.id}
              setTeam={(team) => {
                setSidequestFilter(undefined);
                setTeamFilter(team);
                setUserFilter(undefined);
              }}
              size="sm"
            />
            <EventAffiliateSelect
              eventId={eventId}
              affiliateId={userFilter?.id}
              setAffiliate={(affiliate) => {
                setSidequestFilter(undefined);
                setTeamFilter(undefined);
                setUserFilter(affiliate);
              }}
              role={EventRole.Participant}
              size="sm"
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
                {attempts.length ? (
                  attempts.map((attempt) => (
                    <AttemptsTableRow
                      key={objectHash(attempt)}
                      eventId={eventId}
                      attempt={attempt}
                      withUserName
                      manage
                      refetch={refetchAttempts}
                    />
                  ))
                ) : (
                  <NoEntriesTr colSpan={6} />
                )}
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
