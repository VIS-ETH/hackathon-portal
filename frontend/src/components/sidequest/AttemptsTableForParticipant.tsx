import AttemptsTable from "./AttemptsTable";
import CooldownText from "./CooldownText";

import {
  useGetMe,
  useGetSidequestAttemptCooldown,
  useGetSidequestAttempts,
} from "@/api/gen";
import {
  cardProps,
  cardSectionProps,
  iconProps,
  toolbarButtonProps,
} from "@/styles/common";

import { Button, Card, Group, Stack } from "@mantine/core";

import { IconRefresh } from "@tabler/icons-react";

type AttemptsTableForParticipantProps = {
  eventId: string;
};

const AttemptsTableForParticipant = ({
  eventId,
}: AttemptsTableForParticipantProps) => {
  const { data: me } = useGetMe();

  const { data: attempts = [], refetch: refetchAttempts } =
    useGetSidequestAttempts(
      {
        event_id: eventId,
        user_id: me?.id,
      },
      {
        query: {
          enabled: !!me,
        },
      },
    );

  const { data: cooldown, refetch: refetchCooldown } =
    useGetSidequestAttemptCooldown({
      event_id: eventId,
    });

  return (
    <Stack>
      <Card {...cardProps}>
        <Card.Section {...cardSectionProps}>
          <Group justify="space-between">
            <Button
              {...toolbarButtonProps}
              leftSection={<IconRefresh {...iconProps} />}
              onClick={() => {
                refetchAttempts();
                refetchCooldown();
              }}
            >
              Refresh
            </Button>
            {cooldown && <CooldownText cooldown={cooldown} />}
          </Group>
        </Card.Section>
        <Card.Section>
          <AttemptsTable
            eventId={eventId}
            attempts={attempts}
            refetch={refetchAttempts}
          />
        </Card.Section>
      </Card>
    </Stack>
  );
};

export default AttemptsTableForParticipant;
