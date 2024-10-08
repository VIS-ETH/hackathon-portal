import classes from "./Footer.module.css";

import {
  Center,
  Container,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";

import Link from "next/link";

const Footer = () => {
  return (
    <div className={classes.footer}>
      <Container my="lg">
        <Stack gap={0}>
          <SimpleGrid
            spacing="xl"
            cols={{
              xs: 1,
              md: 3,
            }}
          >
            <Center>
              <Text ta="left" c="dimmed" size="sm">
                Presented by Hannes Eberhard, Ramon Wick, Andri Florin and Dario
                Ackermann
              </Text>
            </Center>
            {/* <Center>
              <Link href="https://inf.ethz.ch">
                <Image
                  src="/assets/logos/dinfk/ethz_dinfk.svg"
                  h={62}
                  w="auto"
                  alt="D-INFK"
                />
              </Link>
            </Center> */}
            <Center>
              <Link href="https://vis.ethz.ch">
                <Image
                  src="/assets/logos/vis/vis_logo.svg"
                  h={52}
                  w="auto"
                  alt="VIS"
                />
              </Link>
            </Center>
            <Center>
              <Link href="https://vseth.ethz.ch">
                <Image
                  src="/assets/logos/vseth/vseth_Logo_bylines_Fachverein.png"
                  h={62}
                  w="auto"
                  alt="VSETH"
                />
              </Link>
            </Center>
          </SimpleGrid>
        </Stack>
      </Container>
    </div>
  );
};

export default Footer;
