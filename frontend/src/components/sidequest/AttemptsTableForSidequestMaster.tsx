import EventAffiliateSelect from "../select/EventAffiliateSelect";
import SidequestSelect from "../select/SidequestSelect";
import TeamSelect from "../select/TeamSelect";
import AttemptsTable from "./AttemptsTable";
import CreateAttemptDrawer from "./CreateAttemptDrawer";

import { useGetSidequestAttempts } from "@/api/gen";
import { EventAffiliate, EventRole, Sidequest, Team } from "@/api/gen/schemas";
import {
  cardProps,
  cardSectionProps,
  iconProps,
  secondaryButtonProps,
  toolbarButtonProps,
} from "@/styles/common";

import { useState } from "react";

import { Button, Card, Group, Stack } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconPlus, IconRefresh } from "@tabler/icons-react";

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
              {...toolbarButtonProps}
              leftSection={<IconRefresh {...iconProps} />}
              onClick={() => {
                refetchAttempts();
              }}
            >
              Refresh
            </Button>
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
          </Group>
        </Card.Section>
        <Card.Section>
          <AttemptsTable
            eventId={eventId}
            attempts={attempts}
            manage
            refetch={refetchAttempts}
          />
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
