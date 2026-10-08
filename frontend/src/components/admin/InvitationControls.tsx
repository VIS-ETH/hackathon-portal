import { useInviteUsers } from "@/api/gen";
import { Event, EventRole, UserForCreate } from "@/api/gen/schemas";
import ScrollableSegmentedControl from "@/components/ScrollableSegmentedControl";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  cardProps,
  cardSectionProps,
  codeTextareaProps,
  iconProps,
  toolbarButtonProps,
} from "@/styles/common";

import { useState } from "react";

import { Button, Card, Group, Stack, Text, Textarea } from "@mantine/core";

import { IconPlayerPlay } from "@tabler/icons-react";

type InvitationControlsProps = {
  event: Event;
  onInvite?: () => void;
};

const InvitationControls = ({ event, onInvite }: InvitationControlsProps) => {
  const [input, setInput] = useState("");
  const [role, setRole] = useState<EventRole>(EventRole.Participant);

  const inviteUsersMutation = useInviteUsers();

  useUnsavedChanges(input.trim() !== "");

  const handleRun = async () => {
    const parsed = input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const payloads = parsed.map((authId) => ({
      auth_id: authId,
    })) as UserForCreate[];

    const confirmationText = `Are you sure you want to invite ${payloads.length} users and assign them the role ${role}?\n\n${payloads.map((payload) => `${payload.auth_id}`).join("\n")}`;
    const confirmation = confirm(confirmationText);

    if (!confirmation) {
      return;
    }

    await inviteUsersMutation.mutateAsync({
      eventId: event.id,
      data: {
        roles: [role],
        users: payloads,
      },
    });

    setInput("");
    onInvite?.();
  };

  return (
    <Card {...cardProps}>
      <Card.Section {...cardSectionProps}>
        <Stack>
          <Textarea
            {...codeTextareaProps}
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            label="User auth IDs"
            description="ETH email addresses must be normalized, e.g. be of the form 'ethzusername@ethz.ch'."
            placeholder={PLACEHOLDER}
          />
          <Group justify="space-between">
            <Group miw={0}>
              <Text size="sm">Default role</Text>
              <ScrollableSegmentedControl
                data={Object.values(EventRole)}
                value={role}
                onChange={(value) => setRole(value as EventRole)}
              />
            </Group>
            <Button
              {...toolbarButtonProps}
              leftSection={<IconPlayerPlay {...iconProps} />}
              onClick={handleRun}
              disabled={input.trim() === "" || inviteUsersMutation.isPending}
            >
              Invite Users
            </Button>
          </Group>
        </Stack>
      </Card.Section>
    </Card>
  );
};

const PLACEHOLDER = `heberhard@ethz.ch
rawick@ethz.ch
florina@ethz.ch`;

export default InvitationControls;
