import classes from "./Footer.module.css";

import { iconProps } from "@/styles/common";

import { Container, Flex, Image, SimpleGrid, Stack, Text } from "@mantine/core";

import { IconHeartFilled } from "@tabler/icons-react";
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
              <Text size="xs" c="dimmed" ta={{ base: "center", md: "right" }}>
                Made with{" "}
                <IconHeartFilled
                  {...iconProps}
                  style={{ position: "relative", top: 4 }}
                  color="red"
                />{" "}
                by volunteers at{" "}
                <Link
                  href="https://vis.ethz.ch"
                  target="_blank"
                  style={{
                    textDecoration: "underline",
                    textDecorationStyle: "dotted",
                  }}
                >
                  VIS
                </Link>
                <br />
                Source code available on{" "}
                <Link
                  href="https://github.com/VIS-ETH/hackathon-portal"
                  target="_blank"
                  style={{
                    textDecoration: "underline",
                    textDecorationStyle: "dotted",
                  }}
                >
                  GitHub
                </Link>
              </Text>
            </Flex>
          </SimpleGrid>
        </Stack>
      </Container>
    </div>
  );
};

export default Footer;
