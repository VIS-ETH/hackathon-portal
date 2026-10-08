import { useUpdateSecretValues } from "@/api/gen";
import { Secret, SecretSubject } from "@/api/gen/schemas";
import { useBlurSave } from "@/hooks/useBlurSave";
import { inputProps } from "@/styles/common";
import { fmtTeamIndex } from "@/utils";

import { memo } from "react";

import { PasswordInput, Table, Text } from "@mantine/core";

type SecretCellProps = {
  secret: Secret;
  subject: SecretSubject;
  onSecretChange: (secret: Secret) => void;
};

const SecretCell = ({ secret, subject, onSecretChange }: SecretCellProps) => {
  const updateSecretValuesMutation = useUpdateSecretValues();

  // An empty value removes the value of the subject.
  const value = useBlurSave(secret.values[subject.id] ?? "", async (value) => {
    const updated = await updateSecretValuesMutation.mutateAsync({
      secretId: secret.id,
      data: { [subject.id]: value },
    });

    onSecretChange(updated);
  });

  return (
    <Table.Td>
      <PasswordInput
        {...inputProps}
        size="xs"
        placeholder="N/A"
        value={value.value}
        onChange={(e) => value.setDraft(e.currentTarget.value)}
        onBlur={value.commit}
        disabled={value.saving}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      />
    </Table.Td>
  );
};

type SecretsGridRowProps = {
  subject: SecretSubject;
  secrets: Secret[];
  onSecretChange: (secret: Secret) => void;
};

const SecretsGridRow = ({
  subject,
  secrets,
  onSecretChange,
}: SecretsGridRowProps) => {
  return (
    <Table.Tr>
      <Table.Td>
        <Text size="sm" ff="monospace">
          {/* Teams show their index instead of the `team-NN` key. */}
          {subject.index != null ? fmtTeamIndex(subject.index) : subject.key}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{subject.label}</Text>
      </Table.Td>
      {secrets.map((secret) => (
        <SecretCell
          key={secret.id}
          secret={secret}
          subject={subject}
          onSecretChange={onSecretChange}
        />
      ))}
    </Table.Tr>
  );
};

// A saved cell replaces its whole secret (column), so rows only re-render if one
// of their own values changed, not on every save in the grid.
const areEqual = (prev: SecretsGridRowProps, next: SecretsGridRowProps) =>
  prev.subject === next.subject &&
  prev.onSecretChange === next.onSecretChange &&
  prev.secrets.length === next.secrets.length &&
  prev.secrets.every(
    (secret, i) =>
      secret.id === next.secrets[i].id &&
      secret.values[prev.subject.id] ===
        next.secrets[i].values[next.subject.id],
  );

export default memo(SecretsGridRow, areEqual);
