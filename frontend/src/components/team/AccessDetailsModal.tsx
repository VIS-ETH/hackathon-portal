import { Team } from "@/api/gen/schemas";
import { codeInputProps, codeTextareaProps, modalProps } from "@/styles/common";

import { Center, Modal, Stack, Text, TextInput, Textarea } from "@mantine/core";

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
    <TextInput
      {...codeInputProps}
      size="sm"
      label="Managed address"
      description="This address points to our reverse proxy, which applies security policies and then forwards traffic to your team VM. It can be used for web traffic only."
      value={team.managed_address}
      readOnly
    />
  );

  const directAddressComponent = team.direct_address && (
    <TextInput
      {...codeInputProps}
      size="sm"
      label="Direct address"
      description="This address points directly to your VM's public interface. If you expose custom services on your VM, they will be accessible via this address."
      value={team.direct_address}
      readOnly
    />
  );

  const sshConfigComponent = team.ssh_config && (
    <Textarea
      {...codeTextareaProps}
      size="sm"
      minRows={0}
      wrap="off"
      label="SSH configuration"
      description="This is a ready-to-use SSH configuration snippet. You can copy-paste it into your ~/.ssh/config file (or equivalent) to easily connect to your team VM using the 'ssh' command."
      value={team.ssh_config}
      readOnly
    />
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
