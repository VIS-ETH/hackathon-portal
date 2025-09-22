import {
  hiddenScrollbarStyle,
  iconProps,
  secondaryButtonProps,
} from "@/styles/common";

import { Key, ReactNode, useState } from "react";

import {
  Box,
  Button,
  Center,
  Grid,
  Image,
  Progress,
  Stack,
  Title,
} from "@mantine/core";

import { useHotkeys } from "@mantine/hooks";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

type PresentationProps<T> = {
  elements: T[];
  toKey: (element: T) => Key;
  toTitle: (element: T) => string;
  toContent: (element: T, isActive: boolean | undefined) => ReactNode;
  background?: boolean;
};

const Presentation = <T,>({
  elements,
  toKey,
  toTitle,
  toContent,
  background,
}: PresentationProps<T>) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const length = elements.length;

  const onForward = () => {
    setCurrentIndex((i) => Math.min(length - 1, i + 1));
  };

  const onBack = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  useHotkeys([
    ["ArrowRight", onForward],
    ["Space", onForward],
    ["ArrowLeft", onBack],
  ]);

  if (length === 0) {
    return (
      <Center h="100%">
        <Title>Es können derzeit keine Informationen angezeigt werden</Title>
      </Center>
    );
  }

  const controls = (
    <Grid align="center" p="xs" bg="white">
      <Grid.Col span={2}>
        {currentIndex > 0 && (
          <Button
            {...secondaryButtonProps}
            w="100%"
            color="gray"
            variant="transparent"
            justify="space-between"
            onClick={onBack}
            leftSection={<IconChevronLeft {...iconProps} />}
          >
            {toTitle(elements[currentIndex - 1])}
          </Button>
        )}
      </Grid.Col>
      <Grid.Col span={8}>
        <Progress
          size="xs"
          color="gray"
          value={((currentIndex + 1) / elements.length) * 100}
        />
      </Grid.Col>
      <Grid.Col span={2}>
        {currentIndex < length - 1 && (
          <Button
            {...secondaryButtonProps}
            w="100%"
            color="gray"
            variant="transparent"
            justify="space-between"
            onClick={onForward}
            rightSection={<IconChevronRight {...iconProps} />}
          >
            {toTitle(elements[currentIndex + 1])}
          </Button>
        )}
      </Grid.Col>
    </Grid>
  );

  const backgroundContent = (
    <>
      <Box
        pos="absolute"
        w="26vw"
        style={{
          top: 0,
          left: 0,
          zIndex: -100,
        }}
      >
        <Image
          src="/assets/hexagon/slide-tl.png"
          alt="VIScon Hexagon"
          style={{
            transform: "translate(-20%, -35%)",
          }}
        />
      </Box>
      <Box
        pos="absolute"
        w="36vw"
        style={{
          top: 0,
          right: 0,
          zIndex: -100,
        }}
      >
        <Image
          src="/assets/hexagon/slide-tr.png"
          alt="VIScon Hexagon"
          style={{
            transform: "translate(40%, -30%)",
          }}
        />
      </Box>
      <Box
        pos="absolute"
        w="34vw"
        style={{
          bottom: 0,
          left: 0,
          zIndex: -100,
        }}
      >
        <Image
          src="/assets/hexagon/slide-bl.png"
          alt="VIScon Hexagon"
          style={{
            transform: "translate(-15%, 30%)",
          }}
        />
      </Box>
      <Box
        pos="absolute"
        w="18vw"
        style={{
          bottom: 0,
          right: 0,
          zIndex: -100,
        }}
      >
        <Image
          src="/assets/hexagon/slide-br.png"
          alt="VIScon Hexagon"
          style={{
            transform: "translate(15%, 30%)",
          }}
        />
      </Box>
    </>
  );

  return (
    <>
      <Stack gap={0} h="100%" justify="stretch">
        {controls}
        <Box
          pos="relative"
          pt="xs"
          pb="50px"
          flex={1}
          display="flex"
          style={hiddenScrollbarStyle}
          // TODO: fix scrolling annoyance (we can scroll past "100%" and see the lower parts of the hexagons which should be clipped)
        >
          {[-1, 0, 1].map((offset) => {
            const slideIndex = currentIndex + offset;

            if (slideIndex < 0 || slideIndex >= length) {
              return null;
            }

            return (
              <Box
                key={toKey(elements[slideIndex])}
                hidden={offset != 0}
                flex={1}
                style={hiddenScrollbarStyle}
              >
                {toContent(elements[slideIndex], offset == 0)}
              </Box>
            );
          })}
          {background && backgroundContent}
        </Box>
      </Stack>
    </>
  );
};

export default Presentation;
