import CustomIngressControls from "./CustomIngressControls";
import ManagedIngressControls from "./ManagedIngressControls";

import {
  AccessControlMode,
  CustomIngressConfig,
  IngressConfig,
  ManagedIngressConfig,
  ServerProtocol,
} from "@/api/gen/schemas";
import { cardProps, cardSectionProps } from "@/styles/common";

import { Card, Radio, Stack } from "@mantine/core";

import { produce } from "immer";

export const DEFAULT_MANAGED_CONFIG: ManagedIngressConfig = {
  access_control_mode: AccessControlMode.AuthenticationAuthorization,
  server_port: 8080,
};

export const DEFAULT_CUSTOM_CONFIG: CustomIngressConfig = {
  server_port: 80,
  server_protocol: ServerProtocol.Http,
};

type IngressMode = IngressConfig["mode"];
type GenericConfig = ManagedIngressConfig | CustomIngressConfig;

type GenericIngressControlsProps = {
  config: IngressConfig;
  setConfig: (config: IngressConfig) => void;
};

const GenericIngressControls = ({
  config,
  setConfig,
}: GenericIngressControlsProps) => {
  const setMode = (mode: IngressMode) => {
    setConfig(
      produce(config, (draft) => {
        draft.mode = mode;
        draft.config = draft.config =
          mode === "Managed" ? DEFAULT_MANAGED_CONFIG : DEFAULT_CUSTOM_CONFIG;
      }),
    );
  };

  const setGenericConfig = (genericConfig: GenericConfig) => {
    setConfig(
      produce(config, (draft) => {
        draft.config = genericConfig;
      }),
    );
  };

  const modeControls = (
    <Card.Section {...cardSectionProps}>
      <Radio.Group
        value={config.mode}
        onChange={(value) => setMode(value as IngressMode)}
        name="ingressMode"
        label="Ingress Mode"
        description="Control how your application is exposed to the internet."
      >
        <Stack my="xs" gap="xs">
          <Radio
            value="Managed"
            label="Managed (Recommended)"
            description="Expose your application via our reverse proxy. We'll provide basic security, including handling TLS certificates and access control."
          />
          <Radio
            value="Custom"
            label="Custom"
            description="Expose your application directly to the internet. You are fully responsible for securing your application. Please contact an administrator if you need to modify firewall rules."
          />
        </Stack>
      </Radio.Group>
    </Card.Section>
  );

  return (
    <Card {...cardProps}>
      {modeControls}
      {config.mode == "Managed" && (
        <ManagedIngressControls
          config={config.config}
          setConfig={setGenericConfig}
        />
      )}
      {config.mode === "Custom" && (
        <CustomIngressControls
          config={config.config}
          setConfig={setGenericConfig}
        />
      )}
    </Card>
  );
};

export default GenericIngressControls;
