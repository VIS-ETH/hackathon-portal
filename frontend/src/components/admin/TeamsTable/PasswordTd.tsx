import { useGetTeamPassword, useUpdateTeamPassword } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { inputProps } from "@/styles/common";

import { PasswordInput, PasswordInputProps, Table } from "@mantine/core";

type PasswordTdProps = {
  team: Team;
};

const PasswordTd = ({ team }: PasswordTdProps) => {
  const { data: password, refetch: refetchPassword } = useGetTeamPassword(
    team.id,
  );

  const updatePasswordMutation = useUpdateTeamPassword();

  const handleUpdate = async (value: string) => {
    await updatePasswordMutation.mutateAsync({
      teamId: team.id,
      data: {
        password: value,
      },
    });

    refetchPassword?.();
  };

  return (
    <Table.Td>
      <PasswordInput
        {...(inputProps as PasswordInputProps)}
        size="xs"
        placeholder="Unset"
        value={password?.password ?? ""}
        onChange={(e) => handleUpdate(e.target.value)}
      />
    </Table.Td>
  );
};

export default PasswordTd;
