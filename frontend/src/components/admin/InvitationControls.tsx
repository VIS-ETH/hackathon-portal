import { useInviteUsers } from "@/api/gen";
import { Event, EventRole, UserForCreate } from "@/api/gen/schemas";
import {
  cardProps,
  cardSectionProps,
  iconProps,
  secondaryButtonProps,
  segmentedControlProps,
  textareaProps,
} from "@/styles/common";

import { useState } from "react";

import {
  Button,
  Card,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextareaProps,
} from "@mantine/core";

import { IconPlayerPlay } from "@tabler/icons-react";

type InvitationControlsProps = {
  event: Event;
};

const InvitationControls = ({ event }: InvitationControlsProps) => {
  const [input, setInput] = useState("");
  const [role, setRole] = useState<EventRole>(EventRole.Participant);

  const inviteUsersMutation = useInviteUsers();

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

    alert("Users invited");

    setInput("");
  };

  return (
    <Card {...cardProps}>
      <Card.Section {...cardSectionProps}>
        <Stack>
          <Textarea
            {...(textareaProps as TextareaProps)}
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            description="User Auth IDs. ETH email addresses must be normalized, e.g. always end with '@ethz.ch'."
            placeholder={PLACEHOLDER}
          />
          <Group>
            <Text>Default Role</Text>
            <SegmentedControl
              {...segmentedControlProps}
              data={Object.values(EventRole)}
              value={role}
              onChange={(value) => setRole(value as EventRole)}
            />
          </Group>
        </Stack>
      </Card.Section>
      <Card.Section {...cardSectionProps}>
        <Button
          {...secondaryButtonProps}
          size="sm"
          leftSection={<IconPlayerPlay {...iconProps} />}
          onClick={handleRun}
        >
          Invite Users
        </Button>
      </Card.Section>
    </Card>
  );
};

const PLACEHOLDER = `heberhard@ethz.ch
rawick@ethz.ch
florina@ethz.ch`;

export default InvitationControls;
