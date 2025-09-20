import { useGetTeamCredentials, useUpdateTeamCredentials } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { inputProps } from "@/styles/common";

import { PasswordInput, PasswordInputProps, Table } from "@mantine/core";

type PasswordTdProps = {
  team: Team;
};

const PasswordTd = ({ team }: PasswordTdProps) => {
  const { data: credentials, refetch: refetchCredentials } =
    useGetTeamCredentials(team.id);

  const updatePasswordMutation = useUpdateTeamCredentials();

  const handleUpdate = async (
    password: string | undefined,
    ai_api_key: string | undefined,
  ) => {
    await updatePasswordMutation.mutateAsync({
      teamId: team.id,
      data: {
        vm_password: password,
        ai_api_key: ai_api_key,
    }});

    refetchCredentials?.();
  };

  return (
    <>
      <Table.Td>
        <PasswordInput
          {...(inputProps as PasswordInputProps)}
          size="xs"
          placeholder="Unset"
          value={credentials?.vm_password ?? ""}
          onChange={(e) => handleUpdate(e.target.value, undefined)}
        />
      </Table.Td>
      <Table.Td>
        <PasswordInput
          {...(inputProps as PasswordInputProps)}
          size="xs"
          placeholder="Unset"
          value={credentials?.ai_api_key ?? ""}
          onChange={(e) => handleUpdate(undefined, e.target.value)}
        />
      </Table.Td>
    </>
  );
};

export default PasswordTd;
