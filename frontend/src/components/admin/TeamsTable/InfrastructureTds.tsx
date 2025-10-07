import { useUpdateTeam } from "@/api/gen";
import { AdminTeam, TeamForUpdate } from "@/api/gen/schemas";
import { inputProps } from "@/styles/common";

import {
  Checkbox,
  Table,
  TextInput,
  TextInputProps,
  Textarea,
  TextareaProps,
} from "@mantine/core";

type InfrastructureTdsProps = {
  team: AdminTeam;
  refetch?: () => void;
};

const InfrastructureTds = ({ team, refetch }: InfrastructureTdsProps) => {
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
        <TextInput
          {...(inputProps as TextInputProps)}
          size="xs"
          placeholder={team.managed_address ?? "N/A"}
          value={team.managed_address_override ?? ""}
          onChange={(e) =>
            handleUpdate({
              managed_address_override: e.target.value,
            })
          }
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          {...(inputProps as TextInputProps)}
          size="xs"
          placeholder={team.direct_address ?? "N/A"}
          value={team.direct_address_override ?? ""}
          onChange={(e) =>
            handleUpdate({
              direct_address_override: e.target.value,
            })
          }
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          {...(inputProps as TextInputProps)}
          size="xs"
          placeholder={team.private_address ?? "N/A"}
          value={team.private_address_override ?? ""}
          onChange={(e) =>
            handleUpdate({
              private_address_override: e.target.value,
            })
          }
        />
      </Table.Td>
      <Table.Td>
        <Textarea
          {...(inputProps as TextareaProps)}
          size="xs"
          placeholder={team.ssh_config ?? "N/A"}
          value={team.ssh_config_override ?? ""}
          onChange={(e) =>
            handleUpdate({
              ssh_config_override: e.target.value,
            })
          }
        />
      </Table.Td>
      <Table.Td>
        <Checkbox
          size="xs"
          checked={team.ingress_enabled}
          onChange={(e) =>
            handleUpdate({
              ingress_enabled: e.target.checked,
            })
          }
        />
      </Table.Td>
    </>
  );
};

export default InfrastructureTds;
