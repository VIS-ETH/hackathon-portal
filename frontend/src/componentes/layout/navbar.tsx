"use client";
import { Burger, Group, Avatar, Container, Menu, rem, Tabs, UnstyledButton, Text, Image, Drawer, Button, Divider, ScrollArea } from "@mantine/core";
import cx from 'clsx';
import { useDisclosure } from "@mantine/hooks";
import { PropsWithChildren, useEffect, useState } from "react";
import { IconLogout, IconChevronDown } from '@tabler/icons-react';
import classes from './navbar.module.css';
import Link from "next/link";
import { usePathname } from "next/navigation";

const user = {
  name: 'Andri Florin',
  email: 'florina@vis.ethz.ch',
  image: 'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-5.png',
};

interface Item {
  label: string;
  path: string;
}


type Props = PropsWithChildren & {
  items: Item[]
  section: "TEAM" | "MENTOR" | "MEMBER"
}



export default function Navbar({ children, items, section }: Readonly<Props>) {
  const pathname = usePathname();
  const [drawerOpen, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(items[0].path);

  useEffect(() => {
    setActiveTab(pathname)
  }, [pathname]);

  const NavTitle = (
    <Link href={items[0].path}>
      <Group>
        <Image src="/assets/viscon-logo.svg" h={28} w="auto" alt="viscon logo" />
        <Text fw={700} size="lg">HACKATHON {section != "MEMBER" && `[${section}]`}</Text>
      </Group>
    </Link>
  )

  const mobileItems = items.map(t => (
    <Link
      className={cx(classes.mobileLink, { [classes.mobileLinkActive]: t.path == pathname })}
      key={t.path}
      href={t.path}
    >{t.label}</Link>
  ))


  const desktopItems = items.map((t) => (
    <Link href={t.path} key={t.path}>
      <Tabs.Tab value={t.path} >
        {t.label}
      </Tabs.Tab>
    </Link>
  ));

  const sectionClass = section == "MEMBER" ? classes.sectionMember : (section == "MENTOR" ? classes.sectionMentor : classes.sectionTeam);

  return (
    <>
      <div className={cx(classes.header, sectionClass)}>
        <Container className={classes.mainSection} size="md">
          <Group justify="space-between">
            {NavTitle}

            <Burger opened={drawerOpen} onClick={toggleDrawer} hiddenFrom="sm" size="sm" />

            <Group visibleFrom="sm">
              <Menu
                width={260}
                position="bottom-end"
                transitionProps={{ transition: 'pop-top-right' }}
                onClose={() => setAccountMenuOpen(false)}
                onOpen={() => setAccountMenuOpen(true)}
                withinPortal
              >
                <Menu.Target>
                  <UnstyledButton
                    className={cx(classes.user, { [classes.userActive]: accountMenuOpen })}
                  >
                    <Group gap={7}>
                      <Avatar src={user.image} alt={user.name} radius="xl" size={20} />
                      <Text fw={500} size="sm" lh={1} mr={3}>
                        {user.name}
                      </Text>
                      <IconChevronDown style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={
                      <IconLogout style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                    }
                  >
                    Logout
                  </Menu.Item>
                  <Menu.Label>DEBUG</Menu.Label>
                  <Link href={"/member"}><Menu.Item>Switch to MEMBER</Menu.Item></Link>
                  <Link href={"/mentor"}><Menu.Item>Switch to MENTOR</Menu.Item></Link>
                  <Link href={"/team"}><Menu.Item>Switch to TEAM</Menu.Item></Link>

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
      <Container>
        {children}
      </Container>
    </>
  );
}
