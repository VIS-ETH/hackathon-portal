import classes from "./UserMenu.module.css";

import { useGetMe } from "@/api/gen";
import { useDiscord } from "@/hooks/useDiscord";
import { useLogoutUrl } from "@/hooks/useLogoutUrl";
import { iconProps, menuProps } from "@/styles/common";

import { Avatar, Group, Menu, Text, UnstyledButton } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import {
  IconBrandDiscord,
  IconChevronDown,
  IconKey,
  IconLogout,
} from "@tabler/icons-react";
import cx from "clsx";

type UserMenuProps = {
  // undefined without secrets
  onOpenSecrets?: () => void;
};

const UserMenu = ({ onOpenSecrets }: UserMenuProps) => {
  const { data: me } = useGetMe();
  const [opened, handles] = useDisclosure();
  const { discordAuthUrl } = useDiscord();
  const logoutUrl = useLogoutUrl();

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
          referrerPolicy="no-referrer"
          leftSection={<IconBrandDiscord {...iconProps} />}
        >
          (Re)connect Discord Account
        </Menu.Item>
        {onOpenSecrets && (
          <Menu.Item
            leftSection={<IconKey {...iconProps} />}
            onClick={onOpenSecrets}
          >
            My Secrets
          </Menu.Item>
        )}
        {logoutUrl && (
          <Menu.Item
            component="a"
            href={logoutUrl}
            leftSection={<IconLogout {...iconProps} />}
          >
            Logout
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};

export default UserMenu;
