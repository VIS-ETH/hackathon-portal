import classes from "./UserMenu.module.css";

import { useGetMe } from "@/api/gen";
import UserSecretsModal from "@/components/secrets/UserSecretsModal";
import { useDiscord } from "@/hooks/useDiscord";
import { useLogoutUrl } from "@/hooks/useLogoutUrl";
import { useMySecrets } from "@/hooks/useMySecrets";
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

const UserMenu = () => {
  const { data: me } = useGetMe();
  const [opened, handles] = useDisclosure();
  const { discordAuthUrl } = useDiscord();
  const mySecrets = useMySecrets();
  const [secretsOpened, secretsHandles] = useDisclosure();
  const logoutUrl = useLogoutUrl();

  return (
    <>
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
          {mySecrets.length > 0 && (
            <Menu.Item
              leftSection={<IconKey {...iconProps} />}
              onClick={secretsHandles.open}
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
      <UserSecretsModal
        secrets={mySecrets}
        opened={secretsOpened}
        onClose={secretsHandles.close}
      />
    </>
  );
};

export default UserMenu;
