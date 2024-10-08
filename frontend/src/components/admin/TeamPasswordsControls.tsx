import { useGetTeams, useUpdateTeamPassword } from "@/api/gen";
import { Event } from "@/api/gen/schemas";
import {
  cardProps,
  cardSectionProps,
  iconProps,
  secondaryButtonProps,
  textareaProps,
} from "@/styles/common";

import { useState } from "react";

import {
  Button,
  Card,
  Group,
  Text,
  Textarea,
  TextareaProps,
} from "@mantine/core";

import { IconPlayerPlay } from "@tabler/icons-react";
import { parse } from "yaml";

type TeamPasswordsControlsProps = {
  event: Event;
};

const TeamPasswordsControls = ({ event }: TeamPasswordsControlsProps) => {
  const [input, setInput] = useState("");
  const { data: teams } = useGetTeams({
    event_id: event.id,
  });

  const updateTeamPasswordMutation = useUpdateTeamPassword();

  const indicesAreUnique =
    teams?.length === new Set(teams?.map((team) => team.index)).size;

  const handleRun = async () => {
    if (!indicesAreUnique) {
      return;
    }

    let parsed: object;

    try {
      parsed = parse(input);
    } catch (error) {
      alert(`Failed to parse input: ${error}`);
      return;
    }

    const payloads = Object.entries(parsed)
      .filter(([key]) => key.startsWith("team-"))
      .map(([key, password]) => {
        const index = parseInt(key.replace("team-", ""));
        const team = teams?.find((team) => team.index === index);

        return {
          key,
          index: index,
          id: team?.id,
          name: team?.name,
          password,
        };
      });

    for (const payload of payloads) {
      if (!payload.id) {
        alert(`Team with key ${payload.key} not found`);
        return;
      }
    }

    const confirmationText = `Are you sure you want to update the passwords for ${payloads.length} teams?\n\n${payloads.map((payload) => `${payload.name} (${payload.index}): ${payload.password}`).join("\n")}`;
    const confirmation = confirm(confirmationText);

    if (!confirmation) {
      return;
    }

    for (const payload of payloads) {
      await updateTeamPasswordMutation.mutateAsync({
        teamId: payload.id as string,
        data: {
          password: payload.password as string,
        },
      });
    }

    alert("Passwords updated");

    setInput("");
  };

  return (
    <Card {...cardProps}>
      <Card.Section {...cardSectionProps}>
        <Textarea
          {...(textareaProps as TextareaProps)}
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          placeholder={PLACEHOLDER}
        />
      </Card.Section>
      <Card.Section {...cardSectionProps}>
        <Group>
          <Button
            {...secondaryButtonProps}
            size="sm"
            leftSection={<IconPlayerPlay {...iconProps} />}
            onClick={handleRun}
            disabled={!indicesAreUnique}
          >
            Update Passwords
          </Button>
          {!indicesAreUnique && (
            <Text c="red">Team indices are not unique</Text>
          )}
        </Group>
      </Card.Section>
    </Card>
  );
};

const PLACEHOLDER = `team-01: password1
team-02: password2
team-03: password3`;

export default TeamPasswordsControls;
