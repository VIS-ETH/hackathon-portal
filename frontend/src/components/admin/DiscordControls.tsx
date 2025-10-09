import { useUpdateEvent } from "@/api/gen";
import { Event } from "@/api/gen/schemas";
import { iconProps, largeIconProps } from "@/styles/common";

import React, { useEffect, useState } from "react";

import {
  Accordion,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import { useDebouncedValue } from "@mantine/hooks";

import { yaml } from "@codemirror/lang-yaml";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  IconAlertCircle,
  IconBell,
  IconCheck,
  IconEdit,
  IconEye,
  IconHash,
  IconPencil,
  IconShield,
  IconUsers,
  IconVolume,
  IconX,
} from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";
import Ajv, { JSONSchemaType } from "ajv";
import YAML from "js-yaml";

// ----- Types -----
interface Role {
  name: string;
  slug: string;
  special:
    | "admin"
    | "mentor"
    | "stakeholder"
    | "sidequest_master"
    | "participant";
  color: string;
  show_in_roster?: boolean;
  mentionable?: boolean;
}

interface Category {
  slug: string;
  name: string;
  special?: string;
  visible_to: string | string[] | null;
  writable_by: string | string[] | null;
}

interface Channel {
  name: string;
  category: string;
  visible_to?: string | string[] | null;
  writable_by?: string | string[] | null;
  default_notification?: "all" | "mentions" | "none";
  voice?: boolean;
}

interface DiscordConfig {
  default_permissions: Record<string, boolean>;
  roles: Role[];
  categories: Category[];
  channels: Channel[];
}

// ----- JSON Schema -----
const discordSchema: JSONSchemaType<DiscordConfig> = {
  type: "object",
  properties: {
    default_permissions: {
      type: "object",
      additionalProperties: { type: "boolean" },
    },
    roles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          special: {
            type: "string",
            enum: [
              "admin",
              "mentor",
              "stakeholder",
              "sidequest_master",
              "participant",
            ],
          },
          color: { type: "string" },
          show_in_roster: { type: "boolean", nullable: true, default: true },
          mentionable: { type: "boolean", nullable: true, default: true },
        },
        required: ["name", "slug", "color"],
        additionalProperties: false,
      },
    },
    categories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          slug: { type: "string" },
          name: { type: "string" },
          special: { type: "string", nullable: true },
          visible_to: {
            oneOf: [
              {
                type: "string",
                enum: [
                  "admin",
                  "mentor",
                  "stakeholder",
                  "sidequest_master",
                  "all",
                ],
              },
              {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "admin",
                    "mentor",
                    "stakeholder",
                    "sidequest_master",
                    "all",
                  ],
                },
              },
              { type: "null" },
            ],
            default: "all",
          },
          writable_by: {
            oneOf: [
              {
                type: "string",
                enum: [
                  "admin",
                  "mentor",
                  "stakeholder",
                  "sidequest_master",
                  "all",
                ],
              },
              {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "admin",
                    "mentor",
                    "stakeholder",
                    "sidequest_master",
                    "all",
                  ],
                },
              },
              { type: "null" },
            ],
            default: "admin",
          },
        },
        required: ["slug", "name"],
        additionalProperties: false,
      },
    },
    channels: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          category: { type: "string" },
          visible_to: {
            oneOf: [
              {
                type: "string",
                enum: [
                  "admin",
                  "mentor",
                  "stakeholder",
                  "sidequest_master",
                  "all",
                ],
                nullable: true,
              },
              {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "admin",
                    "mentor",
                    "stakeholder",
                    "sidequest_master",
                    "all",
                  ],
                },
              },
              { type: "null" },
            ],
            default: "all",
          },
          writable_by: {
            oneOf: [
              {
                type: "string",
                enum: [
                  "admin",
                  "mentor",
                  "stakeholder",
                  "sidequest_master",
                  "all",
                ],
              },
              {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "admin",
                    "mentor",
                    "stakeholder",
                    "sidequest_master",
                    "all",
                  ],
                },
              },
              { type: "null" },
            ],
            default: "admin",
          },
          default_notification: {
            type: "string",
            enum: ["all", "mentions", "none"],
            nullable: true,
            default: "none",
          },
          voice: { type: "boolean", nullable: true, default: false },
        },
        required: ["name", "category"],
        additionalProperties: false,
      },
    },
  },
  required: ["categories", "channels", "default_permissions", "roles"],
  additionalProperties: false,
};

// ----- AJV Validator -----
const ajv = new Ajv({ allErrors: true, verbose: true });
const validate = ajv.compile(discordSchema);

// ----- sidequest_master Functions -----
const resolvePermission = (
  permission: string | string[] | null | undefined,
  defaultValue: string,
): string[] => {
  if (!permission) return [defaultValue];
  if (typeof permission === "string") return [permission];
  return permission;
};

const getDefaultValue = (value: unknown, defaultValue: unknown) => {
  return value !== undefined && value !== null ? value : defaultValue;
};

// ----- Validation Hook -----
const useYamlValidation = (yamlInput: string) => {
  const [validationState, setValidationState] = useState<{
    isValid: boolean | null;
    error: string | null;
    data: DiscordConfig | null;
    isLoading: boolean;
  }>({
    isValid: null,
    error: null,
    data: null,
    isLoading: false,
  });

  const [debouncedYaml] = useDebouncedValue(yamlInput, 500);

  useEffect(() => {
    if (!debouncedYaml.trim()) {
      setValidationState({
        isValid: null,
        error: null,
        data: null,
        isLoading: false,
      });
      return;
    }

    setValidationState((prev) => ({ ...prev, isLoading: true }));

    try {
      const data = YAML.load(debouncedYaml) as DiscordConfig;
      const isValid = validate(data);

      if (isValid) {
        setValidationState({
          isValid: true,
          error: null,
          data,
          isLoading: false,
        });
      } else {
        const formattedErrors =
          validate.errors
            ?.map((error) => {
              console.log(error);
              const path = error.dataPath
                ? `at path "${error.dataPath}": `
                : "";
              return `• ${path}${error.message} (${JSON.stringify(error.params)})`;
            })
            .join("\n") || "Unknown validation error";

        setValidationState({
          isValid: false,
          error: formattedErrors,
          data: null,
          isLoading: false,
        });
      }
    } catch (err: unknown) {
      setValidationState({
        isValid: false,
        error: `YAML Syntax Error: ${err instanceof Error ? err.message : String(err)}`,
        data: null,
        isLoading: false,
      });
    }
  }, [debouncedYaml]);

  return validationState;
};

// ----- Preview Component -----
const ConfigPreview: React.FC<{ data: DiscordConfig }> = ({ data }) => {
  const resolvedData = {
    ...data,
    categories: data.categories.map((cat) => ({
      ...cat,
      visible_to: getDefaultValue(cat.visible_to, "all"),
      writable_by: getDefaultValue(cat.writable_by, "admin"),
    })),
    channels: data.channels.map((channel) => ({
      ...channel,
      visible_to: getDefaultValue(channel.visible_to, "all"),
      writable_by: getDefaultValue(channel.writable_by, "admin"),
      default_notification: getDefaultValue(
        channel.default_notification,
        "none",
      ),
      voice: getDefaultValue(channel.voice, false),
    })),
    roles: data.roles.map((role) => ({
      ...role,
      show_in_roster: getDefaultValue(role.show_in_roster, true),
      mentionable: getDefaultValue(role.mentionable, true),
    })),
  };

  return (
    <Stack gap="md">
      {/* Server Overview */}
      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={500}>Server Overview</Text>
          <Badge color="blue" variant="light">
            {resolvedData.roles.length} roles
          </Badge>
        </Group>
        <Group gap="xs" mb="sm">
          <Badge color="teal" variant="light">
            {resolvedData.categories.length} categories
          </Badge>
          <Badge color="violet" variant="light">
            {resolvedData.channels.length} channels
          </Badge>
        </Group>
        {Object.keys(resolvedData.default_permissions).length > 0 && (
          <Text size="sm" c="dimmed">
            Custom default permissions configured
          </Text>
        )}
      </Card>

      {/* Roles */}
      <Accordion variant="contained">
        <Accordion.Item value="roles">
          <Accordion.Control>
            <Group>
              <IconUsers size={18} />
              <Text fw={500}>Roles</Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="xs">
              {resolvedData.roles.map((role, index) => (
                <Group key={index} justify="space-between" wrap="nowrap">
                  <div>
                    <Text size="sm" fw={500}>
                      {role.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {role.slug} • {role.special}
                    </Text>
                  </div>
                  <Group gap="xs">
                    {role.show_in_roster && (
                      <Badge size="xs" variant="outline">
                        Roster
                      </Badge>
                    )}
                    {role.mentionable && (
                      <Badge size="xs" variant="outline">
                        Mention
                      </Badge>
                    )}
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: role.color,
                      }}
                    />
                  </Group>
                </Group>
              ))}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {/* Categories & Channels */}
      <Accordion variant="contained">
        <Accordion.Item value="structure">
          <Accordion.Control>
            <Group>
              <IconHash size={18} />
              <Text fw={500}>Categories & Channels</Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="lg">
              {resolvedData.categories.map((category, catIndex) => {
                const categoryChannels = resolvedData.channels.filter(
                  (channel) => channel.category === category.slug,
                );

                return (
                  <Card key={catIndex} withBorder p="sm">
                    <Group justify="space-between" mb="xs">
                      <Text fw={500}>{category.name}</Text>
                      <Group gap="xs">
                        <Badge size="sm" variant="light" color="blue">
                          {categoryChannels.length} channels
                        </Badge>
                        {category.special && (
                          <Badge size="sm" variant="dot" color="orange">
                            {category.special}
                          </Badge>
                        )}
                      </Group>
                    </Group>

                    {/* Category Permissions */}
                    <Group gap="sm" mb="md">
                      <Badge
                        size="xs"
                        variant="outline"
                        leftSection={<IconEye size={12} />}
                      >
                        {resolvePermission(category.visible_to, "all").join(
                          ", ",
                        )}
                      </Badge>
                      <Badge
                        size="xs"
                        variant="outline"
                        leftSection={<IconPencil size={12} />}
                      >
                        {resolvePermission(category.writable_by, "admin").join(
                          ", ",
                        )}
                      </Badge>
                    </Group>

                    {/* Channels */}
                    <Stack gap="xs">
                      {categoryChannels.map((channel, chanIndex) => (
                        <Group
                          key={chanIndex}
                          justify="space-between"
                          style={{
                            borderLeft: "2px solid #e9ecef",
                            paddingLeft: 8,
                          }}
                        >
                          <Group gap="xs">
                            {channel.voice ? (
                              <IconVolume size={14} color="#228be6" />
                            ) : (
                              <IconHash size={14} color="#868e96" />
                            )}
                            <Text size="sm">{channel.name}</Text>
                          </Group>
                          <Group gap="xs">
                            {channel.visible_to !== "all" && (
                              <Badge
                                size="xs"
                                variant="outline"
                                leftSection={<IconEye size={10} />}
                              >
                                {resolvePermission(
                                  channel.visible_to,
                                  "all",
                                ).join(",")}
                              </Badge>
                            )}
                            {channel.writable_by !== "admin" && (
                              <Badge
                                size="xs"
                                variant="outline"
                                leftSection={<IconPencil size={10} />}
                              >
                                {resolvePermission(
                                  channel.writable_by,
                                  "admin",
                                ).join(",")}
                              </Badge>
                            )}
                            {channel.default_notification !== "none" && (
                              <Badge
                                size="xs"
                                variant="outline"
                                leftSection={<IconBell size={10} />}
                              >
                                {channel.default_notification}
                              </Badge>
                            )}
                          </Group>
                        </Group>
                      ))}
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {/* Default Permissions */}
      {Object.keys(resolvedData.default_permissions).length > 0 && (
        <Accordion variant="contained">
          <Accordion.Item value="permissions">
            <Accordion.Control>
              <Group>
                <IconShield size={18} />
                <Text fw={500}>Default Permissions</Text>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                {Object.entries(resolvedData.default_permissions).map(
                  ([permission, enabled], index) => (
                    <Group key={index} justify="space-between">
                      <Text size="sm" style={{ fontFamily: "monospace" }}>
                        {permission}
                      </Text>
                      <Badge
                        color={enabled ? "green" : "red"}
                        variant="light"
                        size="sm"
                      >
                        {enabled ? "ALLOW" : "DENY"}
                      </Badge>
                    </Group>
                  ),
                )}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}
    </Stack>
  );
};

type DiscordControlsProps = {
  event: Event;
  refetch?: () => void;
};

// ----- Page Component -----
const DiscordConfigPage = ({ event, refetch }: DiscordControlsProps) => {
  const [yamlInput, setYamlInput] = useState(event.discord_config || "");
  const [serverId, setServerId] = useState<string | undefined>(
    event.discord_server_id || "",
  );
  const { isValid, error, data, isLoading } = useYamlValidation(yamlInput);

  const updateEventMutation = useUpdateEvent();

  const hasChanges =
    serverId !== event.discord_server_id || yamlInput !== event.discord_config;

  const handleSave = async () => {
    await updateEventMutation.mutateAsync({
      eventId: event.id,
      data: {
        discord_server_id: serverId,
        ...(isValid && data ? { discord_config: yamlInput } : {}),
      },
    });

    refetch?.();
  };

  const getValidationStatus = () => {
    if (isLoading) return "loading";
    if (isValid === null) return "idle";
    return isValid ? "valid" : "invalid";
  };

  const getStatusColor = () => {
    const status = getValidationStatus();
    switch (status) {
      case "valid":
        return "green";
      case "invalid":
        return "red";
      case "loading":
        return "blue";
      default:
        return "gray";
    }
  };

  const getStatusIcon = () => {
    const status = getValidationStatus();
    switch (status) {
      case "valid":
        return <IconCheck size={16} />;
      case "invalid":
        return <IconX size={16} />;
      case "loading":
        return <Loader size={16} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    const status = getValidationStatus();
    switch (status) {
      case "valid":
        return "Valid YAML";
      case "invalid":
        return "Invalid YAML";
      case "loading":
        return "Validating...";
      default:
        return "Enter YAML to validate";
    }
  };

  const [, setActiveTab] = useState<string | null>();

  return (
    <Stack gap="lg">
      <div>
        <Title order={1} mb="xs">
          Discord Server Configuration
        </Title>
        <Text c="dimmed">
          Configure your Discord server roles, categories, and channels.
          Validation happens automatically as you type.
        </Text>
      </div>

      <TextInput
        label="Discord Server ID"
        description="The ID of your Discord server"
        placeholder="123456789012345678"
        value={serverId}
        onChange={(e) => setServerId(e.currentTarget.value)}
        required
      />

      <Text fw={500}>Server Configuration</Text>

      <Box>
        <Alert
          icon={<IconAlertCircle {...largeIconProps} />}
          color="red"
          radius="md"
          title="RISK OF DATA LOSS!"
          mb="md"
        >
          <Text>
            Due to a technical limitation,{" "}
            <strong>channels are identified by their names</strong>, so renaming
            in the configuration will create a new item and{" "}
            <strong>remove</strong> the old one from the server. If a channel
            rename is needed without loss of history, the rename must be
            manually done on the server, changed manually afterwards here and
            outside of the syncing period! Check the logs to ensure sync is
            done. <b>Renaming a team in the Teams tab is supported</b> (uses
            indexes to identify teams).
          </Text>
        </Alert>
      </Box>

      <Tabs defaultValue="edit" mt="-md" onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="edit" leftSection={<IconEdit {...iconProps} />}>
            Edit
          </Tabs.Tab>
          <Tabs.Tab value="preview" leftSection={<IconEye {...iconProps} />}>
            Preview
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="edit" mt="md">
          <Paper withBorder p="md" radius="md" style={{ height: "100%" }}>
            <Group justify="space-between" mb="sm">
              <div>
                <Text fw={500}>Configuration YAML</Text>
                <Text size="sm" c="dimmed">
                  Define your server configuration in YAML format
                </Text>
              </div>
              <Badge
                color={getStatusColor()}
                variant="filled"
                leftSection={getStatusIcon()}
              >
                {getStatusText()}
              </Badge>
            </Group>
            <CodeMirror
              value={yamlInput}
              height="600px"
              theme={oneDark}
              extensions={[yaml()]}
              onChange={(value) => setYamlInput(value)}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLine: true,
              }}
            />

            {isLoading && (
              <Group gap="xs" mt="sm">
                <Loader size="sm" />
                <Text size="sm" color="blue">
                  Validating YAML...
                </Text>
              </Group>
            )}

            {isValid === false && error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Validation Error"
                color="red"
                mt="md"
              >
                <Text style={{ whiteSpace: "pre-wrap" }} size="sm">
                  {error}
                </Text>
              </Alert>
            )}
          </Paper>
        </Tabs.Panel>
        <Tabs.Panel value="preview" mt="md">
          <Paper withBorder p="md" radius="md" style={{ height: "100%" }}>
            <Text fw={500} mb="sm">
              Configuration Preview
            </Text>
            <Text size="sm" color="dimmed" mb="md">
              How your server will be structured
            </Text>

            {isValid === true && data ? (
              <ConfigPreview data={data} />
            ) : (
              <Card withBorder style={{ borderStyle: "dashed" }}>
                <Text c="dimmed" ta="center">
                  {isValid === false
                    ? "Fix validation errors to see preview"
                    : "Enter valid YAML to see configuration preview"}
                </Text>
              </Card>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <Button
        style={{ display: "block", textAlign: "left" }}
        disabled={!hasChanges || !isValid || !serverId}
        onClick={handleSave}
        size="lg"
        fullWidth
        mt="md"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span>Apply Discord Configuration</span>
          <small style={{ fontSize: "0.75rem", marginTop: 5 }}>
            Note: Synchronization runs every 2 minutes - be patient!
          </small>
        </div>
      </Button>
    </Stack>
  );
};

export default DiscordConfigPage;
