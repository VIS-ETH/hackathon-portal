import { useUpdateTeam } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { inputProps } from "@/styles/common";

import { Table, TextInput, TextInputProps } from "@mantine/core";

type NameTdProps = {
  team: Team;
  ro?: boolean;
  refetch?: () => void;
};

const NameTd = ({ team, ro, refetch }: NameTdProps) => {
  const updateTeamMutation = useUpdateTeam();

  const handleUpdate = async (name: string) => {
    if (name === "") {
      return;
    }

    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      data: {
        name: name,
      },
    });

    refetch?.();
  };

  return (
    <Table.Td>
      <TextInput
        {...(inputProps as TextInputProps)}
        size="xs"
        value={team.name}
        onChange={async (value) => handleUpdate(value.target.value)}
        readOnly={ro}
      />
    </Table.Td>
  );
};

export default NameTd;
