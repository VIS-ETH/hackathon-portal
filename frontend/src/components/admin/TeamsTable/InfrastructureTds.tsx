import { useUpdateTeam } from "@/api/gen";
import { AdminTeam, TeamForUpdate } from "@/api/gen/schemas";
import { useBlurSave } from "@/hooks/useBlurSave";
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
  refetch?: () => Promise<unknown>;
};

const InfrastructureTds = ({ team, refetch }: InfrastructureTdsProps) => {
  const updateTeamMutation = useUpdateTeam();

  const handleUpdate = async (data: TeamForUpdate) => {
    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      data,
    });

    await refetch?.();
  };

  const managedAddress = useBlurSave(
    team.managed_address_override ?? "",
    (value) => handleUpdate({ managed_address_override: value }),
  );
  const directAddress = useBlurSave(
    team.direct_address_override ?? "",
    (value) => handleUpdate({ direct_address_override: value }),
  );
  const privateAddress = useBlurSave(
    team.private_address_override ?? "",
    (value) => handleUpdate({ private_address_override: value }),
  );
  const sshConfig = useBlurSave(team.ssh_config_override ?? "", (value) =>
    handleUpdate({ ssh_config_override: value }),
  );

  return (
    <>
      <Table.Td>
        <TextInput
          {...(inputProps as TextInputProps)}
          size="xs"
          placeholder={team.managed_address ?? "N/A"}
          value={managedAddress.value}
          onChange={(e) => managedAddress.setDraft(e.currentTarget.value)}
          onBlur={managedAddress.commit}
          disabled={managedAddress.saving}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          {...(inputProps as TextInputProps)}
          size="xs"
          placeholder={team.direct_address ?? "N/A"}
          value={directAddress.value}
          onChange={(e) => directAddress.setDraft(e.currentTarget.value)}
          onBlur={directAddress.commit}
          disabled={directAddress.saving}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          {...(inputProps as TextInputProps)}
          size="xs"
          placeholder={team.private_address ?? "N/A"}
          value={privateAddress.value}
          onChange={(e) => privateAddress.setDraft(e.currentTarget.value)}
          onBlur={privateAddress.commit}
          disabled={privateAddress.saving}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </Table.Td>
      <Table.Td>
        <Textarea
          {...(inputProps as TextareaProps)}
          size="xs"
          placeholder={team.ssh_config ?? "N/A"}
          value={sshConfig.value}
          onChange={(e) => sshConfig.setDraft(e.currentTarget.value)}
          onBlur={sshConfig.commit}
          disabled={sshConfig.saving}
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
