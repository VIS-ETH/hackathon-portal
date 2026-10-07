import { useUpdateSecretValues } from "@/api/gen";
import { Secret, SecretScope, SecretSubject } from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  codeTextareaProps,
  iconProps,
  inputProps,
  toolbarButtonProps,
} from "@/styles/common";

import { useState } from "react";

import {
  Button,
  Group,
  Select,
  SelectProps,
  Stack,
  Textarea,
  TextareaProps,
} from "@mantine/core";

import { useClipboard } from "@mantine/hooks";

import { IconCopy, IconPlayerPlay } from "@tabler/icons-react";
import { parse } from "yaml";

// Quotes keys that are not plain YAML scalars, e.g. auth ids containing an `@`.
const fmtYamlKey = (key: string) =>
  /^[\w.-]+$/.test(key) ? key : JSON.stringify(key);

// Pads each column to its widest entry plus one space, so the values and
// comments line up in columns that can be selected across all lines at once.
const fmtYamlLines = (
  rows: { key: string; value: string; comment: string }[],
) => {
  const keys = rows.map((row) => `${fmtYamlKey(row.key)}:`);
  const keyWidth = Math.max(...keys.map((key) => key.length)) + 1;
  const valueWidth = Math.max(...rows.map((row) => row.value.length)) + 1;

  return rows
    .map(
      (row, i) =>
        `${keys[i].padEnd(keyWidth)}${row.value.padEnd(valueWidth)}# ${row.comment}`,
    )
    .join("\n");
};

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
  // The subjects currently shown in the grid, which the template is made of.
  templateSubjects: SecretSubject[];
  disabled?: boolean;
  onSecretChange: (secret: Secret) => void;
};

const SecretImportControls = ({
  scope,
  secrets,
  subjects,
  templateSubjects,
  disabled,
  onSecretChange,
}: SecretImportControlsProps) => {
  const [secretId, setSecretId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const clipboard = useClipboard();

  const updateSecretValuesMutation = useUpdateSecretValues();

  useUnsavedChanges(input.trim() !== "");

  const secret = secrets.find((secret) => secret.id === secretId);
  const placeholder =
    scope === SecretScope.Team ? PLACEHOLDER_TEAM : PLACEHOLDER_USER;

  const handleCopyTemplate = () => {
    clipboard.copy(
      fmtYamlLines(
        templateSubjects.map((subject) => ({
          key: subject.key,
          value: '""',
          comment: subject.label,
        })),
      ),
    );
  };

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
    <Stack>
      <Textarea
        {...(codeTextareaProps as TextareaProps)}
        value={input}
        onChange={(event) => setInput(event.currentTarget.value)}
        placeholder={placeholder}
        description="Import values as YAML. Empty values are skipped."
        disabled={disabled}
      />
      <Group>
        <Select
          {...(inputProps as SelectProps)}
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
        <Button
          {...toolbarButtonProps}
          leftSection={<IconCopy {...iconProps} />}
          onClick={handleCopyTemplate}
          disabled={disabled || !templateSubjects.length}
        >
          {clipboard.copied
            ? "Copied"
            : `Copy Template (${templateSubjects.length})`}
        </Button>
      </Group>
    </Stack>
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
