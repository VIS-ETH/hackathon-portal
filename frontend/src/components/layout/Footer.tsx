import classes from "./Footer.module.css";

import { Container, Flex, Image, SimpleGrid, Stack } from "@mantine/core";

import Link from "next/link";

const Footer = () => {
  return (
    <div className={classes.footer}>
      <Container my="lg">
        <Stack gap={0}>
          <SimpleGrid
            spacing="xl"
            cols={{
              base: 1,
              md: 3,
            }}
          >
            <Flex align="center" justify={{ base: "center", md: "flex-start" }}>
              <Link href="https://inf.ethz.ch">
                <Image
                  h={60}
                  w="auto"
                  src="/assets/logos/dinfk/ethz_dinfk.svg"
                  alt="D-INFK"
                />
              </Link>
            </Flex>
            <Flex align="center" justify="center">
              <Link href="https://vis.ethz.ch">
                <Image
                  h={50}
                  w="auto"
                  src="/assets/logos/vis/vis_logo.svg"
                  alt="VIS"
                />
              </Link>
            </Flex>
            <Flex align="center" justify={{ base: "center", md: "flex-end" }}>
              <Link href="https://vseth.ethz.ch">
                <Image
                  h={60}
                  w="auto"
                  src="/assets/logos/vseth/vseth_Logo_bylines_Fachverein.png"
                  alt="VSETH"
                />
              </Link>
            </Flex>
          </SimpleGrid>
        </Stack>
      </Container>
    </div>
  );
};

export default Footer;
