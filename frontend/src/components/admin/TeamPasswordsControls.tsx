import { useGetTeams, useUpdateTeam } from "@/api/gen";
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
  const [pw_input, setPWInput] = useState("");
  const [ml_input, setMLInput] = useState("");

  const { data: teams } = useGetTeams({
    event_id: event.id,
  });

  const updateTeamMutation = useUpdateTeam();

  const indicesAreUnique =
    teams?.length === new Set(teams?.map((team) => team.index)).size;

  const handleRun = async () => {
    if (!indicesAreUnique) {
      return;
    }

    let pw_parsed: object;
    let ml_parsed: object;

    try {
      if (pw_input === "") {
        pw_parsed = {};
      } else {
        pw_parsed = parse(pw_input);
      }
    } catch (error) {
      alert(`Failed to parse password input: ${error}`);
      return;
    }

    try {
      if (ml_input === "") {
        ml_parsed = {};
      } else {
        ml_parsed = parse(ml_input);
      }
    } catch (error) {
      alert(`Failed to parse AI key input: ${error}`);
      return;
    }

    const pw_payloads = Object.entries(pw_parsed)
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

    const ai_keys_payload = Object.entries(ml_parsed)
      .filter(([key]) => key.startsWith("team-"))
      .map(([key, ai_key]) => {
        const index = parseInt(key.replace("team-", ""));
        const team = teams?.find((team) => team.index === index);

        return {
          key,
          index: index,
          id: team?.id,
          name: team?.name,
          ai_key,
        };
      });

    for (const payload of [...pw_payloads, ...ai_keys_payload]) {
      if (!payload.id) {
        alert(`Team with key ${payload.key} not found`);
        return;
      }
    }

    const keys = new Set([
      ...ai_keys_payload.map((payload) => payload.key),
      ...pw_payloads.map((payload) => payload.key),
    ]);

    const payloads = Array.from(keys).map((key) => {
      const pw_payload = pw_payloads.find((payload) => payload.key === key);
      const ai_payload = ai_keys_payload.find((payload) => payload.key === key);

      return {
        key,
        index: pw_payload?.index || ai_payload?.index,
        id: pw_payload?.id || ai_payload?.id,
        name: pw_payload?.name || ai_payload?.name,
        password: pw_payload?.password,
        ai_api_key: ai_payload?.ai_key,
      };
    });

    const confirmationText = `Are you sure you want to update the passwords for ${payloads.length} teams?\n\n${payloads.map((payload) => `${payload.name} (${payload.index}): ${payload.password} ${payload.ai_api_key}`).join("\n")}`;
    const confirmation = confirm(confirmationText);

    if (!confirmation) {
      return;
    }

    for (const payload of payloads) {
      await updateTeamMutation.mutateAsync({
        teamId: payload.id as string,
        data: {
          password: payload.password?.toString(),
          ai_api_key: payload.ai_api_key?.toString(),
        },
      });
    }

    alert("Passwords updated");

    setPWInput("");
    setMLInput("");
  };

  return (
    <Card {...cardProps}>
      <Card.Section {...cardSectionProps}>
        <Group grow>
          <Textarea
            {...(textareaProps as TextareaProps)}
            value={pw_input}
            onChange={(event) => setPWInput(event.currentTarget.value)}
            placeholder={PLACEHOLDER_PW}
            description="VM Passwords"
          />
          <Textarea
            {...(textareaProps as TextareaProps)}
            value={ml_input}
            onChange={(event) => setMLInput(event.currentTarget.value)}
            placeholder={PLACEHOLDER_ML}
            description="AI Keys"
          />
        </Group>
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
            Update Credentials
          </Button>
          {!indicesAreUnique && (
            <Text c="red">Team indices are not unique</Text>
          )}
        </Group>
      </Card.Section>
    </Card>
  );
};

const PLACEHOLDER_PW = `team-01: password1
team-02: password2
team-03: password3`;

const PLACEHOLDER_ML = `team-01: key1
team-02: key2
team-03: key3`;

export default TeamPasswordsControls;
