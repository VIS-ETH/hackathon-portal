import classes from "./footer.module.css";

import {
  AppLayoutLink,
  AppLayoutSection,
} from "@/componentes/layout/app-layout";

import { Container, Group, Image } from "@mantine/core";
import Link from "next/link";


type NavbarProps = {
  footerItems: AppLayoutLink[];
  section: AppLayoutSection;
};

export default function Footer({  }: Readonly<NavbarProps>) {
  return (
    <div className={classes.footer}>
      <Container>
        <Group justify="space-between" my="md">
          <Link href="https://inf.ethz.ch">
            <Image src="/assets/logos/dinfk/ethz_dinfk.svg" h={62} w="auto" alt="viscon logo" />
          </Link>
          <Link href="https://vis.ethz.ch">
            <Image src="/assets/logos/vis/vis_logo.svg" h={52} w="auto" alt="viscon logo" />
          </Link>
          <Link href="https://vseth.ethz.ch">
          <Image src="/assets/logos/vseth/vseth_Logo_bylines_Fachverein.png" h={62} w="auto" alt="viscon logo" />
          </Link>
        </Group>

      </Container>
    </div>
  );
}
