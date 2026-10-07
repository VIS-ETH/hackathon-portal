import { cardHeaderSectionProps, cardHeaderTextProps } from "@/styles/common";

import { ReactNode } from "react";

import { Card, Flex, Text } from "@mantine/core";

type CardHeaderProps = {
  title: ReactNode;
  actions?: ReactNode;
};

const CardHeader = ({ title, actions }: CardHeaderProps) => {
  return (
    <Card.Section {...cardHeaderSectionProps}>
      <Flex
        justify="space-between"
        align="center"
        wrap="wrap"
        columnGap="md"
        rowGap="xs"
      >
        <Text {...cardHeaderTextProps}>{title}</Text>
        {actions}
      </Flex>
    </Card.Section>
  );
};

export default CardHeader;
