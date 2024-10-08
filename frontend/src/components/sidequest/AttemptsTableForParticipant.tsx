import AttemptsTableRow from "./AttemptsTableRow";
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
  secondaryButtonProps,
} from "@/styles/common";

import { Button, Card, Group, Stack, Table } from "@mantine/core";

import { IconRefresh } from "@tabler/icons-react";
import objectHash from "object-hash";

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
              {...secondaryButtonProps}
              size="sm"
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
          <Table.ScrollContainer minWidth={1000}>
            <Table striped layout="fixed">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Sidequest</Table.Th>
                  <Table.Th>Result</Table.Th>
                  <Table.Th>Day</Table.Th>
                  <Table.Th>Time</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {attempts.map((attempt) => (
                  <AttemptsTableRow
                    key={objectHash(attempt)}
                    eventId={eventId}
                    attempt={attempt}
                    refetch={refetchAttempts}
                  />
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card.Section>
      </Card>
    </Stack>
  );
};

export default AttemptsTableForParticipant;
