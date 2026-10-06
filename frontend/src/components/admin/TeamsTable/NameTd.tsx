import { useUpdateTeam } from "@/api/gen";
import { AdminTeam } from "@/api/gen/schemas";
import { useBlurSave } from "@/hooks/useBlurSave";
import { inputProps } from "@/styles/common";

import { Table, TextInput, TextInputProps } from "@mantine/core";

type NameTdProps = {
  team: AdminTeam;
  ro?: boolean;
  refetch?: () => Promise<unknown>;
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

    await refetch?.();
  };

  const name = useBlurSave(team.name, handleUpdate);

  return (
    <Table.Td>
      <TextInput
        {...(inputProps as TextInputProps)}
        size="xs"
        value={name.value}
        onChange={(e) => name.setDraft(e.currentTarget.value)}
        onBlur={name.commit}
        disabled={name.saving}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        readOnly={ro}
      />
    </Table.Td>
  );
};

export default NameTd;
