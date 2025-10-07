import { useUpdateTeam } from "@/api/gen";
import { AdminTeam, TeamForUpdate } from "@/api/gen/schemas";
import { inputProps } from "@/styles/common";

import { PasswordInput, PasswordInputProps, Table } from "@mantine/core";

type CredentialsTdProps = {
  team: AdminTeam;
  refetch?: () => void;
};

const CredentialsTd = ({ team, refetch }: CredentialsTdProps) => {
  const updateTeamMutation = useUpdateTeam();

  const handleUpdate = async (data: TeamForUpdate) => {
    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      data,
    });

    refetch?.();
  };

  return (
    <>
      <Table.Td>
        <PasswordInput
          {...(inputProps as PasswordInputProps)}
          size="xs"
          placeholder="N/A"
          value={team.password ?? ""}
          onChange={(e) => handleUpdate({ password: e.target.value })}
        />
      </Table.Td>
      <Table.Td>
        <PasswordInput
          {...(inputProps as PasswordInputProps)}
          size="xs"
          placeholder="N/A"
          value={team.ai_api_key ?? ""}
          onChange={(e) => handleUpdate({ ai_api_key: e.target.value })}
        />
      </Table.Td>
    </>
  );
};

export default CredentialsTd;
