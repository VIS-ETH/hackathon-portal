import { DiscordConfig } from "./config";

import CardHeader from "@/components/CardHeader";
import NoEntriesTr from "@/components/NoEntriesTr";
import {
  badgeProps,
  cardProps,
  cardSectionProps,
  iconProps,
  indicatorBadgeProps,
} from "@/styles/common";

import { ReactNode } from "react";

import {
  Badge,
  Card,
  ColorSwatch,
  Group,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from "@mantine/core";

import {
  IconCheck,
  IconEye,
  IconHash,
  IconPencil,
  IconVolume,
} from "@tabler/icons-react";

const resolvePermission = (
  permission: string | string[] | null | undefined,
  defaultValue: string,
): string[] => {
  if (!permission) return [defaultValue];
  if (typeof permission === "string") return [permission];
  return permission;
};

type ChannelGroupProps = {
  title: ReactNode;
  badges: ReactNode;
  channels: {
    name: string;
    voice: boolean;
    visible_to: string[];
    writable_by: string[];
    default_notification: string;
  }[];
};

const ChannelGroup = ({ title, badges, channels }: ChannelGroupProps) => (
  <>
    <Card.Section {...cardSectionProps} py="xs">
      <Group justify="space-between">
        <Group gap="xs">{title}</Group>
        <Group gap="xs">{badges}</Group>
      </Group>
    </Card.Section>
    <Card.Section withBorder>
      <Table.ScrollContainer minWidth={600}>
        <Table striped layout="fixed" horizontalSpacing="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="40%">Channel</Table.Th>
              <Table.Th>Visible to</Table.Th>
              <Table.Th>Writable by</Table.Th>
              <Table.Th w={120}>Notifications</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {channels.map((channel, index) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon
                      variant="transparent"
                      color={channel.voice ? "blue" : "gray"}
                      size="sm"
                    >
                      {channel.voice ? (
                        <IconVolume {...iconProps} />
                      ) : (
                        <IconHash {...iconProps} />
                      )}
                    </ThemeIcon>
                    <Text size="sm" truncate>
                      {channel.name}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>{channel.visible_to.join(", ")}</Table.Td>
                <Table.Td>{channel.writable_by.join(", ")}</Table.Td>
                <Table.Td>{channel.default_notification}</Table.Td>
              </Table.Tr>
            ))}
            {channels.length === 0 && <NoEntriesTr colSpan={4} />}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card.Section>
  </>
);

type ConfigPreviewProps = {
  data: DiscordConfig;
};

const ConfigPreview = ({ data }: ConfigPreviewProps) => {
  const resolvedData = {
    ...data,
    categories: data.categories.map((cat) => ({
      ...cat,
      visible_to: resolvePermission(cat.visible_to, "all"),
      writable_by: resolvePermission(cat.writable_by, "admin"),
    })),
    channels: data.channels.map((channel) => ({
      ...channel,
      visible_to: resolvePermission(channel.visible_to, "all"),
      writable_by: resolvePermission(channel.writable_by, "admin"),
      default_notification: channel.default_notification ?? "none",
      voice: channel.voice ?? false,
    })),
    roles: data.roles.map((role) => ({
      ...role,
      show_in_roster: role.show_in_roster ?? true,
      mentionable: role.mentionable ?? true,
    })),
  };

  const defaultPermissions = Object.entries(resolvedData.default_permissions);

  const categorySlugs = new Set(resolvedData.categories.map((c) => c.slug));
  const uncategorizedChannels = resolvedData.channels.filter(
    (channel) => !categorySlugs.has(channel.category),
  );
  const unknownSlugs = [
    ...new Set(uncategorizedChannels.map((channel) => channel.category)),
  ];

  return (
    <Stack>
      <Card {...cardProps}>
        <CardHeader
          title="Roles"
          actions={
            <Badge {...badgeProps}>{resolvedData.roles.length} roles</Badge>
          }
        />
        <Card.Section>
          <Table.ScrollContainer minWidth={600}>
            <Table striped layout="fixed" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w="30%">Name</Table.Th>
                  <Table.Th>Slug</Table.Th>
                  <Table.Th>Special</Table.Th>
                  <Table.Th w={80}>Roster</Table.Th>
                  <Table.Th w={80}>Mention</Table.Th>
                  <Table.Th w={70}>Color</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {resolvedData.roles.map((role, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>{role.name}</Table.Td>
                    <Table.Td>{role.slug}</Table.Td>
                    <Table.Td>{role.special}</Table.Td>
                    <Table.Td>
                      {role.show_in_roster && <IconCheck {...iconProps} />}
                    </Table.Td>
                    <Table.Td>
                      {role.mentionable && <IconCheck {...iconProps} />}
                    </Table.Td>
                    <Table.Td>
                      <ColorSwatch color={role.color} size={16} />
                    </Table.Td>
                  </Table.Tr>
                ))}
                {resolvedData.roles.length === 0 && <NoEntriesTr colSpan={6} />}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card.Section>
      </Card>

      <Card {...cardProps}>
        <CardHeader
          title="Categories & Channels"
          actions={
            <Group gap="xs">
              <Badge {...badgeProps}>
                {resolvedData.categories.length} categories
              </Badge>
              <Badge {...badgeProps}>
                {resolvedData.channels.length} channels
              </Badge>
            </Group>
          }
        />
        {resolvedData.categories.map((category, catIndex) => (
          <ChannelGroup
            key={catIndex}
            title={
              <>
                <Text fw={700}>{category.name}</Text>
                {category.special && (
                  <Badge {...indicatorBadgeProps} color="orange">
                    {category.special}
                  </Badge>
                )}
              </>
            }
            badges={
              <>
                <Badge
                  {...badgeProps}
                  leftSection={<IconEye {...iconProps} size={12} />}
                >
                  {category.visible_to.join(", ")}
                </Badge>
                <Badge
                  {...badgeProps}
                  leftSection={<IconPencil {...iconProps} size={12} />}
                >
                  {category.writable_by.join(", ")}
                </Badge>
              </>
            }
            channels={resolvedData.channels.filter(
              (channel) => channel.category === category.slug,
            )}
          />
        ))}
        {uncategorizedChannels.length > 0 && (
          <ChannelGroup
            title={<Text fw={700}>Unknown category</Text>}
            badges={unknownSlugs.map((slug) => (
              <Badge key={slug} {...badgeProps} color="red" variant="light">
                {slug}
              </Badge>
            ))}
            channels={uncategorizedChannels}
          />
        )}
      </Card>

      {defaultPermissions.length > 0 && (
        <Card {...cardProps}>
          <CardHeader title="Default Permissions" />
          <Card.Section>
            <Table striped horizontalSpacing="md">
              <Table.Tbody>
                {defaultPermissions.map(([permission, enabled]) => (
                  <Table.Tr key={permission}>
                    <Table.Td ff="monospace">{permission}</Table.Td>
                    <Table.Td ta="right">
                      <Badge
                        {...badgeProps}
                        color={enabled ? "green" : "red"}
                        variant="light"
                      >
                        {enabled ? "Allow" : "Deny"}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card.Section>
        </Card>
      )}
    </Stack>
  );
};

export default ConfigPreview;
