"use client";

import classes from "./navbar.module.css";

import {
  AppLayoutLink,
  AppLayoutSection,
  AppLayoutUser,
} from "@/componentes/layout/app-layout";

import { useEffect, useState } from "react";

import {
  Avatar,
  Burger,
  Container,
  Divider,
  Drawer,
  Group,
  Image,
  Menu,
  ScrollArea,
  Tabs,
  Text,
  UnstyledButton,
  rem, Badge
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconChevronDown, IconLogout } from "@tabler/icons-react";
import cx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavbarProps = {
  headerItems: AppLayoutLink[];
  section: AppLayoutSection;
  user: AppLayoutUser;
  baseUrl: string;
};

export default function Navbar({
  headerItems: headerItemsRaw,
  section,
  user,
  baseUrl
}: Readonly<NavbarProps>) {
  const pathname = usePathname();

  const headerItems: AppLayoutLink[] = headerItemsRaw.map((item) => ({...item, path: baseUrl + item.path}));


  const [drawerOpen, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(headerItems[0].path);

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  const NavTitle = (
    <Link href={headerItems[0].path}>
      <Group>
        <Image
          src="/assets/viscon-logo.svg"
          h={28}
          w="auto"
          alt="viscon logo"
        />

        <Group align="center">
          <Text fw={700} size="lg">
            HACKATHON
          </Text>
          <Badge variant="default" size="md" radius="sm">{section}</Badge>
        </Group>
      </Group>
    </Link>
  );

  const mobileItems = headerItems.map((t) => (
    <Link
      className={cx(classes.mobileLink, {
        [classes.mobileLinkActive]: t.path == pathname,
      })}
      key={t.path}
      href={t.path}
      onClick={closeDrawer}
    >
      {t.label}
    </Link>
  ));

  const desktopItems = headerItems.map((t) => (
    <Link href={t.path} key={t.path}>
      <Tabs.Tab value={t.path}>{t.label}</Tabs.Tab>
    </Link>
  ));

  const sectionClass =
    section == "PARTICIPANT"
      ? classes.sectionMember
      : section == "MENTOR"
        ? classes.sectionMentor
        : classes.sectionTeam;

  return (
    <>
      <div className={cx(classes.header, sectionClass)}>
        <Container className={classes.mainSection} size="md">
          <Group justify="space-between">
            {NavTitle}

            <Burger
              opened={drawerOpen}
              onClick={toggleDrawer}
              hiddenFrom="sm"
              size="sm"
            />

            <Group visibleFrom="sm">
              <Menu
                width={260}
                position="bottom-end"
                transitionProps={{ transition: "pop-top-right" }}
                onClose={() => setAccountMenuOpen(false)}
                onOpen={() => setAccountMenuOpen(true)}
                withinPortal
              >
                <Menu.Target>
                  <UnstyledButton
                    className={cx(classes.user, {
                      [classes.userActive]: accountMenuOpen,
                    })}
                  >
                    <Group gap={7}>
                      <Avatar
                        src={user.image}
                        alt={user.name}
                        radius="xl"
                        size={20}
                      />
                      <Text fw={500} size="sm" lh={1} mr={3}>
                        {user.name}
                      </Text>
                      <IconChevronDown
                        style={{ width: rem(12), height: rem(12) }}
                        stroke={1.5}
                      />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={
                      <IconLogout
                        style={{ width: rem(16), height: rem(16) }}
                        stroke={1.5}
                      />
                    }
                  >
                    Logout
                  </Menu.Item>
                  <Menu.Label>DEBUG</Menu.Label>
                  <Link href={baseUrl + "/participant"}>
                    <Menu.Item>Switch to PARTICIPANT</Menu.Item>
                  </Link>
                  <Link href={baseUrl + "/mentor"}>
                    <Menu.Item>Switch to MENTOR</Menu.Item>
                  </Link>
                  <Link href={baseUrl + "/team"}>
                    <Menu.Item>Switch to TEAM</Menu.Item>
                  </Link>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
          <Drawer
            opened={drawerOpen}
            onClose={closeDrawer}
            size="100%"
            padding="md"
            title={NavTitle}
            hiddenFrom="sm"
            zIndex={1000000}
          >
            <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
              <Divider my="sm" />

              {mobileItems}

              <Divider my="sm" />

              <Group justify="center" grow pb="xl" px="md">
                <p>todo: add account menu</p>
              </Group>
            </ScrollArea>
          </Drawer>
        </Container>
        <Container size="md">
          <Tabs
            value={activeTab}
            defaultValue="Home"
            variant="outline"
            visibleFrom="sm"
            classNames={{
              root: classes.tabs,
              list: classes.tabsList,
              tab: classes.tab,
            }}
          >
            <Tabs.List>{desktopItems}</Tabs.List>
          </Tabs>
        </Container>
      </div>
    </>
  );
}
