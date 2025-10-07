import classes from "./UserMenu.module.css";

import { useGetMe } from "@/api/gen";
import { useDiscord } from "@/hooks/useDiscord";
import { iconProps, menuProps } from "@/styles/common";

import { Avatar, Group, Menu, Text, UnstyledButton } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import {
  IconBrandDiscord,
  IconChevronDown,
  IconLogout,
} from "@tabler/icons-react";
import cx from "clsx";

const UserMenu = () => {
  const { data: me } = useGetMe();
  const [opened, handles] = useDisclosure();
  const { discordAuthUrl } = useDiscord();

  return (
    <Menu
      {...menuProps}
      width={260}
      onOpen={handles.open}
      onClose={handles.close}
      withinPortal
    >
      <Menu.Target>
        <UnstyledButton
          className={cx(classes.user, {
            [classes.userActive]: opened,
          })}
        >
          <Group gap={7} align="center">
            <Avatar name={me?.name} color="dark" radius="xl" size={20} />
            <Text fw={500} size="sm" lh={1} mx={4}>
              {me?.name}
            </Text>
            <IconChevronDown {...iconProps} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{me?.auth_id}</Menu.Label>
        <Menu.Item
          component="a" // 'a' for anchor tag
          href={discordAuthUrl}
          leftSection={<IconBrandDiscord {...iconProps} />}
        >
          (Re)connect Discord Account
        </Menu.Item>
        <Menu.Item
          component="a"
          href="https://auth.viscon-hackathon.ch"
          leftSection={<IconLogout {...iconProps} />}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default UserMenu;
