import { cardHeaderSectionProps, cardHeaderTextProps } from "@/styles/common";

import { ReactNode } from "react";

import { Card, Group, Text } from "@mantine/core";

type CardHeaderProps = {
  title: ReactNode;
  actions?: ReactNode;
};

const CardHeader = ({ title, actions }: CardHeaderProps) => {
  return (
    <Card.Section {...cardHeaderSectionProps}>
      <Group justify="space-between" wrap="nowrap">
        <Text {...cardHeaderTextProps}>{title}</Text>
        {actions}
      </Group>
    </Card.Section>
  );
};

export default CardHeader;
