"use client";

import classes from "./Navbar.module.css";
import UserMenu from "./UserMenu";

import { useGetMe } from "@/api/gen";
import UserSecretsModal from "@/components/secrets/UserSecretsModal";
import { useDiscord } from "@/hooks/useDiscord";
import { useLogoutUrl } from "@/hooks/useLogoutUrl";
import { useMySecrets } from "@/hooks/useMySecrets";
import { useResolveParams } from "@/hooks/useResolveParams";
import {
  badgeProps,
  containerProps,
  wideContainerProps,
} from "@/styles/common";

import {
  Badge,
  Box,
  Burger,
  Container,
  Divider,
  Drawer,
  Group,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  UnstyledButton,
  rem,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import cx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavbarProps = {
  wide?: boolean;
};

const Navbar = ({ wide = false }: NavbarProps) => {
  const pathname = usePathname();
  const { data: me } = useGetMe();
  const { eventSlug, event, policies } = useResolveParams();
  const [drawerOpened, drawerHandles] = useDisclosure(false);
  const { discordAuthUrl } = useDiscord();
  const mySecrets = useMySecrets();
  const [secretsOpened, secretsHandles] = useDisclosure(false);
  const logoutUrl = useLogoutUrl();

  const tabs = [
    {
      label: "Overview",
      path: `/events/${eventSlug}`,
      visible: true,
    },
    {
      label: "Schedule",
      path: `/events/${eventSlug}/schedule`,
      visible: policies?.can_view_event_internal,
    },
    {
      label: "Registration",
      path: `/events/${eventSlug}/registration`,
      visible: policies?.can_create_team,
    },
    {
      label: "Rating",
      path: `/events/${eventSlug}/rating`,
      visible:
        policies?.can_manage_jury_rating || policies?.can_manage_public_vote,
    },
    {
      label: "Teams",
      path: `/events/${eventSlug}/teams`,
      visible: true,
    },
    {
      label: "Projects",
      path: `/events/${eventSlug}/projects`,
      visible: policies?.can_view_project,
    },
    {
      label: "Sidequests",
      path: `/events/${eventSlug}/sidequests`,
      visible: policies?.can_view_sidequest,
    },
    {
      label: "Documentation",
      path: `/events/${eventSlug}/documentation`,
      visible: policies?.can_view_event_internal,
    },
    {
      label: "Admin",
      path: `/events/${eventSlug}/admin`,
      visible: policies?.can_manage_event,
    },
  ].filter((tab) => tab.visible);

  // Find the active tab based on the current pathname
  // Reverse the tabs such that `Overview` is matched last
  const activePath = [...tabs]
    .reverse()
    .find((t) => pathname.startsWith(t.path))?.path;

  const mobileTabs = tabs.map((t) => (
    <Link
      key={t.path}
      href={t.path}
      onClick={drawerHandles.close}
      className={cx(classes.mobileLink, {
        [classes.mobileLinkActive]: t.path == activePath,
      })}
    >
      {t.label}
    </Link>
  ));

  const desktopTabs = tabs.map((t) => (
    <Tabs.Tab
      key={t.path}
      value={t.path}
      renderRoot={(props) => <Link {...props} href={t.path} />}
    >
      {t.label}
    </Tabs.Tab>
  ));

  const title = (
    <Link href="/">
      <Group>
        <Group align="center">
          <Text fw={700} size="lg">
            {event?.name ?? "Loading"}
          </Text>
          {event && (
            <Badge {...badgeProps} visibleFrom="sm">
              {event.phase}
            </Badge>
          )}
        </Group>
      </Group>
    </Link>
  );

  return (
    <Box bg="var(--mantine-color-primary-2)">
      <Container {...(wide ? wideContainerProps : containerProps)}>
        <Stack gap={0}>
          <Group justify="space-between" py="md">
            {title}
            <Burger
              opened={drawerOpened}
              onClick={drawerHandles.toggle}
              size="sm"
              hiddenFrom="sm"
            />
            <Box visibleFrom="sm">
              <UserMenu
                onOpenSecrets={
                  mySecrets.length > 0 ? secretsHandles.open : undefined
                }
              />
            </Box>
          </Group>
          <Drawer
            opened={drawerOpened}
            onClose={drawerHandles.close}
            size="100%"
            padding="md"
            title={title}
            hiddenFrom="sm"
            zIndex={1000000}
          >
            <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
              <Divider my="sm" />
              {mobileTabs}
              <Divider my="sm" />
              <a
                href={discordAuthUrl}
                className={classes.mobileLink}
                referrerPolicy="no-referrer"
              >
                (Re)connect Discord Account
              </a>
              {mySecrets.length > 0 && (
                <UnstyledButton
                  className={classes.mobileLink}
                  w="100%"
                  onClick={() => {
                    // The drawer would cover the modal.
                    drawerHandles.close();
                    secretsHandles.open();
                  }}
                >
                  My Secrets
                </UnstyledButton>
              )}
              {logoutUrl && (
                // plain anchor: the logout URL is not a Next.js route and must not be prefetched
                <a href={logoutUrl} className={classes.mobileLink}>
                  Logout
                </a>
              )}
              <Divider my="sm" />
              <Box px="md">
                <Text size="sm" c="dimmed">
                  {me?.name}
                </Text>
                <Text size="sm" c="dimmed">
                  {me?.auth_id}
                </Text>
              </Box>
            </ScrollArea>
          </Drawer>
          <UserSecretsModal
            secrets={mySecrets}
            opened={secretsOpened}
            onClose={secretsHandles.close}
          />
          <Tabs
            value={activePath}
            variant="outline"
            visibleFrom="sm"
            classNames={{
              root: classes.tabs,
              list: classes.tabsList,
              tab: classes.tab,
            }}
          >
            <Tabs.List>{desktopTabs}</Tabs.List>
          </Tabs>
        </Stack>
      </Container>
    </Box>
  );
};

export default Navbar;
