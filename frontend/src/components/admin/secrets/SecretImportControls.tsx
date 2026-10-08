import { fmtYamlLines } from "./fmtYaml";

import { useUpdateSecretValues } from "@/api/gen";
import { Secret, SecretScope, SecretSubject } from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  cardProps,
  cardSectionProps,
  codeTextareaProps,
  iconProps,
  inputProps,
  toolbarButtonProps,
} from "@/styles/common";

import { useState } from "react";

import { Button, Card, Group, Select, Stack, Textarea } from "@mantine/core";

import { IconPlayerPlay } from "@tabler/icons-react";
import { parse } from "yaml";

// Teams are matched by their index, so `team-1` works as well as `team-01`.
const findSubject = (subjects: SecretSubject[], key: string) => {
  const teamIndex = /^team-(\d+)$/.exec(key)?.[1];

  return subjects.find((subject) =>
    subject.index != null && teamIndex !== undefined
      ? subject.index === parseInt(teamIndex)
      : subject.key === key,
  );
};

type SecretImportControlsProps = {
  scope: SecretScope;
  secrets: Secret[];
  subjects: SecretSubject[];
  disabled?: boolean;
  onSecretChange: (secret: Secret) => void;
};

const SecretImportControls = ({
  scope,
  secrets,
  subjects,
  disabled,
  onSecretChange,
}: SecretImportControlsProps) => {
  const [secretId, setSecretId] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const updateSecretValuesMutation = useUpdateSecretValues();

  useUnsavedChanges(input.trim() !== "");

  const secret = secrets.find((secret) => secret.id === secretId);
  const placeholder =
    scope === SecretScope.Team ? PLACEHOLDER_TEAM : PLACEHOLDER_USER;

  const handleRun = async () => {
    if (!secret) {
      return;
    }

    let parsed: unknown;

    try {
      // The failsafe schema keeps all values as strings, e.g. `0123` stays `0123`.
      parsed = parse(input, { schema: "failsafe" });
    } catch (error) {
      alert(`Failed to parse input: ${error}`);
      return;
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      alert("The input must be a mapping from keys to values");
      return;
    }

    const resolved = Object.entries(parsed).map(([key, value]) => ({
      key,
      subject: findSubject(subjects, key),
      value: typeof value === "string" ? value : "",
    }));

    // Different keys can resolve to the same subject, e.g. `team-1` and `team-01`.
    const duplicateKeys = resolved
      .filter(
        (entry) =>
          entry.subject &&
          resolved.some(
            (other) => other !== entry && other.subject === entry.subject,
          ),
      )
      .map((entry) => entry.key);

    if (duplicateKeys.length) {
      alert(`Duplicate keys:\n\n${duplicateKeys.join("\n")}`);
      return;
    }

    // Empty values are skipped, so a partially filled template never removes
    // existing values.
    const entries = resolved.filter((entry) => entry.value !== "");

    const unknownKeys = entries
      .filter((entry) => !entry.subject)
      .map((entry) => entry.key);

    if (unknownKeys.length) {
      alert(`Unknown keys:\n\n${unknownKeys.join("\n")}`);
      return;
    }

    if (!entries.length) {
      alert("There are no values to import");
      return;
    }

    const confirmation = confirm(
      `Are you sure you want to set the secret "${secret.name}" for ${entries.length} ${scope === SecretScope.Team ? "teams" : "users"}?\n\n${entries.map((entry) => `${entry.subject?.key} (${entry.subject?.label})`).join("\n")}`,
    );

    if (!confirmation) {
      return;
    }

    const updated = await updateSecretValuesMutation.mutateAsync({
      secretId: secret.id,
      data: Object.fromEntries(
        entries.map((entry) => [entry.subject?.id, entry.value]),
      ),
    });

    onSecretChange(updated);
    setInput("");
  };

  return (
    <Card {...cardProps}>
      <Card.Section {...cardSectionProps}>
        <Stack>
          <Textarea
            {...codeTextareaProps}
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            label="Values"
            description="YAML. Empty values are skipped."
            placeholder={placeholder}
            disabled={disabled}
          />
          <Group justify="space-between">
            <Select
              {...inputProps}
              size="sm"
              placeholder="Secret"
              data={secrets.map((secret) => ({
                value: secret.id,
                label: secret.name,
              }))}
              value={secretId}
              onChange={setSecretId}
            />
            <Button
              {...toolbarButtonProps}
              leftSection={<IconPlayerPlay {...iconProps} />}
              onClick={handleRun}
              disabled={
                disabled ||
                !secret ||
                input.trim() === "" ||
                updateSecretValuesMutation.isPending
              }
            >
              Import
            </Button>
          </Group>
        </Stack>
      </Card.Section>
    </Card>
  );
};

const PLACEHOLDER_TEAM = fmtYamlLines([
  { key: "team-01", value: "password1", comment: "Team Alpha" },
  { key: "team-02", value: "password2", comment: "Team Beta" },
  { key: "team-10", value: "password10", comment: "Team Gamma" },
]);

const PLACEHOLDER_USER = fmtYamlLines([
  { key: "alice@ethz.ch", value: "key1", comment: "Alice" },
  { key: "bob@example.com", value: "key2", comment: "Bob" },
]);

export default SecretImportControls;
