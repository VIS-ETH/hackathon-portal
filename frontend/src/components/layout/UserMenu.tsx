import classes from "./UserMenu.module.css";

import { useGetMe } from "@/api/gen";
import { iconProps } from "@/styles/common";

import { Avatar, Group, Menu, Text, UnstyledButton } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconChevronDown, IconLogout } from "@tabler/icons-react";
import cx from "clsx";

const UserMenu = () => {
  const { data: me } = useGetMe();
  const [opened, handles] = useDisclosure();

  return (
    <Menu
      width={260}
      position="bottom-end"
      transitionProps={{ transition: "pop-top-right" }}
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
