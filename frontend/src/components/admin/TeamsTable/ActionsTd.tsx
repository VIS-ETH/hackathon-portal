import { useDeleteTeam } from "@/api/gen";
import { AdminTeam } from "@/api/gen/schemas";
import { iconProps, secondaryButtonProps } from "@/styles/common";

import { Button, Group, Table } from "@mantine/core";

import { IconTrash } from "@tabler/icons-react";

type ActionsTdProps = {
  team: AdminTeam;
  refetch?: () => void;
};

const ActionsTd = ({ team, refetch }: ActionsTdProps) => {
  const deleteMutation = useDeleteTeam();

  const handleDelete = async () => {
    const confirmation = window.confirm(
      `Are you sure you want to delete team ${team.name}?`,
    );

    if (!confirmation) {
      return;
    }

    await deleteMutation.mutateAsync({
      teamId: team.id,
    });

    refetch?.();
  };

  return (
    <Table.Td>
      <Group gap="xs">
        <Button
          {...secondaryButtonProps}
          leftSection={<IconTrash {...iconProps} />}
          color="red"
          onClick={handleDelete}
        >
          Delete
        </Button>
      </Group>
    </Table.Td>
  );
};

export default ActionsTd;
