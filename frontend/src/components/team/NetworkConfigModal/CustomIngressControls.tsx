import { DEFAULT_CUSTOM_CONFIG } from "./GenericIngressControls";

import { CustomIngressConfig, ServerProtocol } from "@/api/gen/schemas";
import { cardSectionProps, inputProps } from "@/styles/common";
import { parseIntStrict } from "@/utils";

import { Card, NumberInput, Radio, Stack } from "@mantine/core";

import { produce } from "immer";

type CustomIngressControlsProps = {
  config: CustomIngressConfig;
  setConfig: (config: CustomIngressConfig) => void;
};

const CustomIngressControls = ({
  config,
  setConfig,
}: CustomIngressControlsProps) => {
  const handleUpdateServerPort = (port: string | number) => {
    setConfig(
      produce(config, (draft) => {
        draft.server_port =
          parseIntStrict(port) ?? DEFAULT_CUSTOM_CONFIG.server_port;
      }),
    );
  };

  const handleUpdateServerProtocol = (protocol: ServerProtocol) => {
    setConfig(
      produce(config, (draft) => {
        draft.server_protocol = protocol;
      }),
    );
  };

  return (
    <>
      <Card.Section {...cardSectionProps}>
        <NumberInput
          {...inputProps}
          size="sm"
          value={config.server_port}
          onChange={(value) => handleUpdateServerPort(value)}
          placeholder={DEFAULT_CUSTOM_CONFIG.server_port.toString()}
          min={1}
          max={65535}
          step={1}
          name="serverPort"
          label="Server port"
          description="The internal port your application listens on. This must match the port configured in your code (e.g., `process.env.PORT` or `app.listen(8080)`)."
        />
      </Card.Section>
      <Card.Section {...cardSectionProps}>
        <Radio.Group
          value={config.server_protocol}
          onChange={(value) =>
            handleUpdateServerProtocol(value as ServerProtocol)
          }
          name="serverProtocol"
          label="Server protocol"
          description="The protocol your application uses to communicate."
        >
          <Stack my="xs" gap="xs">
            <Radio value={ServerProtocol.Http} label="HTTP" />
            <Radio value={ServerProtocol.Https} label="HTTPS" />
          </Stack>
        </Radio.Group>
      </Card.Section>
    </>
  );
};

export default CustomIngressControls;
