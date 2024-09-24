import classes from "./footer.module.css";

import {
  AppLayoutLink,
  AppLayoutSection,
} from "@/componentes/layout/app-layout";

import { ActionIcon, Container, Group, rem } from "@mantine/core";

import {
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandYoutube,
} from "@tabler/icons-react";
import Link from "next/link";

type NavbarProps = {
  footerItems: AppLayoutLink[];
  section: AppLayoutSection;
};

export default function Footer({ footerItems }: Readonly<NavbarProps>) {
  return (
    <div className={classes.footer}>
      <Container>
        <div className={classes.inner}>
          <Group className={classes.links}>
            {footerItems.map((link) => (
              <Link key={link.label} href={link.path}>
                {link.label}
              </Link>
            ))}
          </Group>

          <Group gap="xs" justify="flex-end" wrap="nowrap">
            <ActionIcon size="lg" variant="default" radius="xl">
              <IconBrandTwitter
                style={{ width: rem(18), height: rem(18) }}
                stroke={1.5}
              />
            </ActionIcon>
            <ActionIcon size="lg" variant="default" radius="xl">
              <IconBrandYoutube
                style={{ width: rem(18), height: rem(18) }}
                stroke={1.5}
              />
            </ActionIcon>
            <ActionIcon size="lg" variant="default" radius="xl">
              <IconBrandInstagram
                style={{ width: rem(18), height: rem(18) }}
                stroke={1.5}
              />
            </ActionIcon>
          </Group>
        </div>
      </Container>
    </div>
  );
}
