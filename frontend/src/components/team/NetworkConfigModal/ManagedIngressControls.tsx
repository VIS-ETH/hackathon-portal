import { DEFAULT_MANAGED_CONFIG } from "./GenericIngressControls";

import { AccessControlMode, ManagedIngressConfig } from "@/api/gen/schemas";
import { cardSectionProps, inputProps } from "@/styles/common";
import { parseIntStrict } from "@/utils";

import {
  Card,
  NumberInput,
  NumberInputProps,
  Radio,
  Stack,
} from "@mantine/core";

import { produce } from "immer";

type ManagedIngressControlsProps = {
  config: ManagedIngressConfig;
  setConfig: (config: ManagedIngressConfig) => void;
};

const ManagedIngressControls = ({
  config,
  setConfig,
}: ManagedIngressControlsProps) => {
  const handleUpdateAccessControlMode = (mode: AccessControlMode) => {
    setConfig(
      produce(config, (draft) => {
        draft.access_control_mode = mode;
      }),
    );
  };

  const handleUpdateServerPort = (port: string | number) => {
    setConfig(
      produce(config, (draft) => {
        draft.server_port =
          parseIntStrict(port) ?? DEFAULT_MANAGED_CONFIG.server_port;
      }),
    );
  };

  return (
    <>
      <Card.Section {...cardSectionProps}>
        <Radio.Group
          value={config.access_control_mode}
          onChange={(value) =>
            handleUpdateAccessControlMode(value as AccessControlMode)
          }
          name="accessControlMode"
          label="Access Control Mode"
          description="Control who can access your application and what user information is passed to it."
        >
          <Stack my="xs" gap="xs">
            <Radio
              value={AccessControlMode.AuthenticationAuthorization}
              label="Authentication & Authorization (Recommended)"
              description="Grants access only to authorized users (your team members and hackathon staff). Your application will receive the X-User-Id and X-User-Name headers to identify the user."
            />
            <Radio
              value={AccessControlMode.Authentication}
              label="Authentication only"
              description="Grants access to anyone with a Switch edu-ID account. Note that anyone can self-register an edu-ID. Your application will receive the X-User-Id and X-User-Name headers to identify the user."
            />
            <Radio
              value={AccessControlMode.None}
              label="Disabled"
              description="Enables public access for anyone on the internet. Your application will not receive any user identity headers."
            />
          </Stack>
        </Radio.Group>
      </Card.Section>
      <Card.Section {...cardSectionProps}>
        <NumberInput
          {...(inputProps as NumberInputProps)}
          size="sm"
          value={config.server_port}
          onChange={(value) => handleUpdateServerPort(value)}
          placeholder={DEFAULT_MANAGED_CONFIG.server_port.toString()}
          min={1}
          max={65535}
          step={1}
          name="serverPort"
          label="Server Port"
          description="The internal port your application listens on. This must match the port configured in your code (e.g., `process.env.PORT` or `app.listen(8080)`)."
        />
      </Card.Section>
    </>
  );
};

export default ManagedIngressControls;
