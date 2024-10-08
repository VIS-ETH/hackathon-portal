"use client";

import classes from "./Navbar.module.css";
import UserMenu from "./UserMenu";

import { useGetMe } from "@/api/gen";
import { useResolveParams } from "@/hooks/useResolveParams";
import { containerProps } from "@/styles/common";

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
  rem,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import cx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const pathname = usePathname();
  const { data: me } = useGetMe();
  const { event, policies } = useResolveParams();
  const [drawerOpened, drawerHandles] = useDisclosure(false);

  const tabs = [
    {
      label: "Overview",
      path: `/events/${event?.slug}`,
      visible: true,
    },
    {
      label: "Schedule",
      path: `/events/${event?.slug}/schedule`,
      visible: policies?.can_view_event_internal,
    },
    {
      label: "Registration",
      path: `/events/${event?.slug}/registration`,
      visible: policies?.can_create_team,
    },
    {
      label: "Teams",
      path: `/events/${event?.slug}/teams`,
      visible: true,
    },
    {
      label: "Projects",
      path: `/events/${event?.slug}/projects`,
      visible: true,
    },
    {
      label: "Sidequests",
      path: `/events/${event?.slug}/sidequests`,
      visible: policies?.can_view_event_internal,
    },
    {
      label: "Documentation",
      path: `/events/${event?.slug}/documentation`,
      visible: policies?.can_view_event_internal,
    },
    {
      label: "Admin",
      path: `/events/${event?.slug}/admin`,
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
    <Link key={t.path} href={t.path}>
      <Tabs.Tab value={t.path}>{t.label}</Tabs.Tab>
    </Link>
  ));

  const title = (
    <Link href="/">
      <Group>
        <Group align="center">
          <Text fw={700} size="lg">
            {event?.name ?? "Loading"}
          </Text>
          {event && (
            <Badge variant="default" size="md" radius="sm">
              {event.phase}
            </Badge>
          )}
        </Group>
      </Group>
    </Link>
  );

  return (
    <Box bg="var(--mantine-color-primary-2)">
      <Container {...containerProps}>
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
              <UserMenu />
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
              <Link
                href="https://auth.viscon-hackathon.ch"
                referrerPolicy="no-referrer"
                className={cx(classes.mobileLink)}
              >
                Logout
              </Link>
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
