import CardHeader from "../CardHeader";

import { Team } from "@/api/gen/schemas";
import {
  cardProps,
  cardSectionProps,
  codeInputProps,
  codeTextareaProps,
  iconProps,
  secondaryButtonProps,
} from "@/styles/common";

import {
  Button,
  Card,
  Divider,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";

import { IconNetwork } from "@tabler/icons-react";

type AccessDetailsCardProps = {
  team: Team;
  // given if the network configuration may be edited
  onEditNetwork?: () => void;
};

const AccessDetailsCard = ({ team, onEditNetwork }: AccessDetailsCardProps) => {
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
    <Card {...cardProps}>
      <CardHeader title="Access Details" />
      <Card.Section {...cardSectionProps} withBorder={false}>
        {stack ?? (
          <Text c="dimmed">
            No access details available. Please contact an administrator if you
            think this is an error.
          </Text>
        )}
        {onEditNetwork && (
          <>
            {/* the section's padding, so the divider spans the whole card */}
            <Divider my="lg" mx="-md" />
            <Stack gap="sm" align="flex-start">
              {/* styled like the input labels and descriptions above */}
              <Stack gap={2}>
                <Text size="sm" fw={500}>
                  Network configuration
                </Text>
                <Text size="xs" c="dimmed">
                  Control how your application is exposed to the internet: via
                  our reverse proxy with TLS and access control, or directly.
                </Text>
              </Stack>
              <Button
                {...secondaryButtonProps}
                variant="default"
                leftSection={<IconNetwork {...iconProps} />}
                onClick={onEditNetwork}
              >
                Edit Network Configuration
              </Button>
            </Stack>
          </>
        )}
      </Card.Section>
    </Card>
  );
};

export default AccessDetailsCard;
