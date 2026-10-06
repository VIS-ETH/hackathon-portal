import { useUpdateTeam } from "@/api/gen";
import { AdminTeam, TeamForUpdate } from "@/api/gen/schemas";
import { useBlurSave } from "@/hooks/useBlurSave";
import { inputProps } from "@/styles/common";

import { PasswordInput, PasswordInputProps, Table } from "@mantine/core";

type CredentialsTdProps = {
  team: AdminTeam;
  refetch?: () => Promise<unknown>;
};

const CredentialsTd = ({ team, refetch }: CredentialsTdProps) => {
  const updateTeamMutation = useUpdateTeam();

  const handleUpdate = async (data: TeamForUpdate) => {
    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      data,
    });

    await refetch?.();
  };

  const password = useBlurSave(team.password ?? "", (value) =>
    handleUpdate({ password: value }),
  );
  const aiApiKey = useBlurSave(team.ai_api_key ?? "", (value) =>
    handleUpdate({ ai_api_key: value }),
  );

  return (
    <>
      <Table.Td>
        <PasswordInput
          {...(inputProps as PasswordInputProps)}
          size="xs"
          placeholder="N/A"
          value={password.value}
          onChange={(e) => password.setDraft(e.currentTarget.value)}
          onBlur={password.commit}
          disabled={password.saving}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </Table.Td>
      <Table.Td>
        <PasswordInput
          {...(inputProps as PasswordInputProps)}
          size="xs"
          placeholder="N/A"
          value={aiApiKey.value}
          onChange={(e) => aiApiKey.setDraft(e.currentTarget.value)}
          onBlur={aiApiKey.commit}
          disabled={aiApiKey.saving}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </Table.Td>
    </>
  );
};

export default CredentialsTd;
