import { useGetTeamCredentials } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import {
  inputProps,
  modalProps,
  textareaProps,
  tooltipProps,
} from "@/styles/common";

import {
  Center,
  Modal,
  PasswordInput,
  PasswordInputProps,
  Stack,
  Text,
  TextInput,
  TextInputProps,
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
  const { data: credentials } = useGetTeamCredentials(team.id);

  const managedAddressComponent = team.managed_address && (
    <Tooltip
      {...tooltipProps}
      label="This address points to our reverse proxy, which applies security policies and then forwards traffic to your team VM. It can be used for web traffic only."
    >
      <TextInput
        {...(inputProps as TextInputProps)}
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
        {...(inputProps as TextInputProps)}
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
        {...textareaProps}
        size="sm"
        minRows={0}
        label="SSH Configuration"
        value={team.ssh_config}
        readOnly
      />
    </Tooltip>
  );

  const vmPasswordComponent = credentials?.vm_password && (
    <PasswordInput
      {...(inputProps as PasswordInputProps)}
      size="sm"
      label="VM Password"
      value={credentials.vm_password}
      readOnly
    />
  );

  const aiApiKeyComponent = credentials?.ai_api_key && (
    <PasswordInput
      {...(inputProps as PasswordInputProps)}
      size="sm"
      label="AI API Key"
      value={credentials.ai_api_key}
      readOnly
    />
  );

  const stack = (managedAddressComponent ||
    directAddressComponent ||
    sshConfigComponent ||
    vmPasswordComponent ||
    aiApiKeyComponent) && (
    <Stack>
      {managedAddressComponent}
      {directAddressComponent}
      {sshConfigComponent}
      {vmPasswordComponent}
      {aiApiKeyComponent}
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
