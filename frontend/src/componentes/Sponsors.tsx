import { Flex, Image, Stack, Title } from "@mantine/core";

type Props = {
  hidePrimary?: boolean;
  hideSecondary?: boolean;
};

export default function Sponsors({
  hidePrimary,
  hideSecondary,
}: Readonly<Props>) {
  return (
    <Stack align="center">
      {!hidePrimary && (
        <>
          <Title order={1}>Main Sponsors</Title>
          <Flex
            mih={50}
            mb={64}
            gap="md"
            justify="center"
            align="center"
            direction="row"
            wrap="wrap"
          >
            <a target="_blank" href="https://viscon.ethz.ch/2024/sponsors/ergon">
              <Image
                m={32}
                mb={8}
                h={96}
                w="auto"
                src="/assets/logos/sponsors/ergon.svg"
                alt="Logo of main sponsor ERGON"
              />
            </a>
            <a target="_blank" href="https://viscon.ethz.ch/2024/sponsors/airlock">
              <Image
                m={32}
                h={112}
                w="auto"
                src="/assets/logos/sponsors/airlock.svg"
                alt="Logo of main sponsor AIRLOCK"
              />
            </a>
            <a target="_blank" href="https://viscon.ethz.ch/2024/sponsors/ipt">
              <Image
                m={32}
                mb={8}
                h={128}
                w="auto"
                src="/assets/logos/sponsors/ipt.png"
                alt="Logo of main sponsor IPT"
              />
            </a>
            <a target="_blank" href="https://viscon.ethz.ch/2024/sponsors/done">
              <Image
                m={32}
                mb={8}
                h={176}
                w="auto"
                src="/assets/logos/sponsors/done.png"
                alt="Logo of main sponsor D-ONE"
              />
            </a>
          </Flex>
        </>
      )}
      {!hideSecondary && (
        <>
          <Title order={1}>Co-Sponsors</Title>
          <Flex
            mih={50}
            mb={64}
            gap="md"
            justify="center"
            align="center"
            direction="row"
            wrap="wrap"
          >
            <a target="_blank" href="https://viscon.ethz.ch/2024/sponsors/zuehlke">
              <Image
                m={32}
                h={96}
                w="auto"
                src="/assets/logos/sponsors/zuehlke.jpg"
                alt="Main sponsor ZüHLKE"
              />
            </a>
            <a target="_blank" href="https://viscon.ethz.ch/2024/sponsors/leica">
              <Image
                m={32}
                h={64}
                w="auto"
                src="/assets/logos/sponsors/leica.png"
                alt="Main sponsor LEICA"
              />
            </a>
            <a target="_blank" href="https://viscon.ethz.ch/2024/sponsors/ubique">
              <Image
                m={32}
                h={48}
                w="auto"
                src="/assets/logos/sponsors/ubique.svg"
                alt="Main sponsor UBIQUE"
              />
            </a>
            <a target="_blank" href="https://viscon.ethz.ch/2024/sponsors/varian">
              <Image
                m={32}
                h={48}
                w="auto"
                src="/assets/logos/sponsors/varian.png"
                alt="Main sponsor VARIAN"
              />
            </a>
          </Flex>
        </>
      )}
    </Stack>
  );
}
