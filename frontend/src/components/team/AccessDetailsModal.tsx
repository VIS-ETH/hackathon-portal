import { Team } from "@/api/gen/schemas";
import {
  codeInputProps,
  codeTextareaProps,
  modalProps,
  tooltipProps,
} from "@/styles/common";

import {
  Center,
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";

type AccessDetailsModalProps = {
  team: Team;
  opened: boolean;
  onClose: () => void;
};

const AccessDetailsModal = ({
  team,
  opened,
  onClose,
}: AccessDetailsModalProps) => {
  const managedAddressComponent = team.managed_address && (
    <Tooltip
      {...tooltipProps}
      label="This address points to our reverse proxy, which applies security policies and then forwards traffic to your team VM. It can be used for web traffic only."
    >
      <TextInput
        {...codeInputProps}
        size="sm"
        label="Managed Address"
        value={team.managed_address}
        readOnly
      />
    </Tooltip>
  );

  const directAddressComponent = team.direct_address && (
    <Tooltip
      {...tooltipProps}
      label="This address points directly to your VM's public interface. If you expose custom services on your VM, they will be accessible via this address."
    >
      <TextInput
        {...codeInputProps}
        size="sm"
        label="Direct Address"
        value={team.direct_address}
        readOnly
      />
    </Tooltip>
  );

  const sshConfigComponent = team.ssh_config && (
    <Tooltip
      {...tooltipProps}
      label="This is a ready-to-use SSH configuration snippet. You can copy-paste it into your ~/.ssh/config file (or equivalent) to easily connect to your team VM using the 'ssh' command."
    >
      <Textarea
        {...codeTextareaProps}
        size="sm"
        minRows={0}
        wrap="off"
        label="SSH Configuration"
        value={team.ssh_config}
        readOnly
      />
    </Tooltip>
  );

  const stack = (managedAddressComponent ||
    directAddressComponent ||
    sshConfigComponent) && (
    <Stack>
      {managedAddressComponent}
      {directAddressComponent}
      {sshConfigComponent}
    </Stack>
  );

  return (
    <Modal
      {...modalProps}
      opened={opened}
      onClose={onClose}
      title="Access Details"
    >
      {stack ?? (
        <Center>
          <Text c="dimmed">
            No access details available. Please contact an administrator if you
            think this is an error.
          </Text>
        </Center>
      )}
    </Modal>
  );
};

export default AccessDetailsModal;
