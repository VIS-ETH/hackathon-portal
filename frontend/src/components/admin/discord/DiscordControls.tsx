import ApplyConfigModal from "./ApplyConfigModal";
import ConfigPreview from "./ConfigPreview";
import DataLossAlert from "./DataLossAlert";
import { useYamlValidation } from "./config";

import { useUpdateEvent } from "@/api/gen";
import { Event } from "@/api/gen/schemas";
import CardHeader from "@/components/CardHeader";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  alertProps,
  cardProps,
  iconProps,
  inputProps,
  primaryButtonProps,
  tabsPanelProps,
  tabsProps,
} from "@/styles/common";

import { useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Group,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { yaml } from "@codemirror/lang-yaml";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  IconAlertCircle,
  IconCheck,
  IconEdit,
  IconEye,
  IconX,
} from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";

// Module constants, so CodeMirror doesn't reconfigure on every render.
const editorExtensions = [yaml()];
const editorBasicSetup = {
  lineNumbers: true,
  highlightActiveLine: true,
};

const VALIDATION_STATUS = {
  idle: { color: "gray", Icon: null, label: "Enter YAML to validate" },
  valid: { color: "green", Icon: IconCheck, label: "Valid YAML" },
  invalid: { color: "red", Icon: IconX, label: "Invalid YAML" },
};

type DiscordControlsProps = {
  event: Event;
  refetch?: () => void;
};

const DiscordConfigPage = ({ event, refetch }: DiscordControlsProps) => {
  const [yamlInput, setYamlInput] = useState(event.discord_config || "");
  const [serverId, setServerId] = useState<string | undefined>(
    event.discord_server_id || "",
  );
  const { isValid, error, data, pending } = useYamlValidation(yamlInput);

  const updateEventMutation = useUpdateEvent();
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] =
    useDisclosure(false);

  const hasChanges =
    serverId !== (event.discord_server_id ?? "") ||
    yamlInput !== (event.discord_config ?? "");
  useUnsavedChanges(hasChanges);

  const handleSave = async () => {
    await updateEventMutation.mutateAsync({
      eventId: event.id,
      data: {
        discord_server_id: serverId,
        ...(isValid && data ? { discord_config: yamlInput } : {}),
      },
    });

    closeConfirm();
    refetch?.();
  };

  const status =
    VALIDATION_STATUS[
      isValid === null ? "idle" : isValid ? "valid" : "invalid"
    ];

  return (
    <Stack>
      <DataLossAlert />

      <TextInput
        {...inputProps}
        label="Discord server ID"
        description="The ID of your Discord server"
        placeholder="123456789012345678"
        value={serverId}
        onChange={(e) => setServerId(e.currentTarget.value)}
        required
      />

      <Tabs {...tabsProps} defaultValue="edit">
        <Tabs.List>
          <Tabs.Tab value="edit" leftSection={<IconEdit {...iconProps} />}>
            Edit
          </Tabs.Tab>
          <Tabs.Tab value="preview" leftSection={<IconEye {...iconProps} />}>
            Preview
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel {...tabsPanelProps} value="edit">
          <Stack>
            <Card {...cardProps}>
              <CardHeader
                title="Configuration YAML"
                actions={
                  <Badge
                    color={status.color}
                    variant="light"
                    leftSection={status.Icon && <status.Icon {...iconProps} />}
                  >
                    {status.label}
                  </Badge>
                }
              />
              <Card.Section>
                <CodeMirror
                  value={yamlInput}
                  height="600px"
                  theme={oneDark}
                  extensions={editorExtensions}
                  onChange={setYamlInput}
                  basicSetup={editorBasicSetup}
                />
              </Card.Section>
            </Card>

            {isValid === false && error && (
              <Alert
                {...alertProps}
                icon={<IconAlertCircle {...iconProps} />}
                color="red"
                title="Validation error"
              >
                <Code block bg="transparent" p={0}>
                  {error}
                </Code>
              </Alert>
            )}
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel {...tabsPanelProps} value="preview">
          {isValid === true && data ? (
            <ConfigPreview data={data} />
          ) : (
            <Text c="dimmed">
              {isValid === false
                ? "Fix validation errors to see preview"
                : "Enter valid YAML to see configuration preview"}
            </Text>
          )}
        </Tabs.Panel>
      </Tabs>

      <Group justify="flex-end" gap="xs">
        <Text c="dimmed" size="sm">
          Synchronization runs every 2 minutes.
        </Text>
        <Button
          {...primaryButtonProps}
          disabled={!hasChanges || pending || !isValid || !serverId}
          onClick={openConfirm}
          loading={updateEventMutation.isPending}
        >
          Apply Configuration
        </Button>
      </Group>

      <ApplyConfigModal
        opened={confirmOpened}
        onClose={closeConfirm}
        onApply={handleSave}
        loading={updateEventMutation.isPending}
        savedServerId={event.discord_server_id ?? ""}
        savedYaml={event.discord_config ?? ""}
        serverId={serverId ?? ""}
        yamlInput={yamlInput}
      />
    </Stack>
  );
};

export default DiscordConfigPage;
