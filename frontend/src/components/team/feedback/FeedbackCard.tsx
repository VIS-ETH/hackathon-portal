import CardHeader from "../../CardHeader";

import { cardProps, cardSectionProps } from "@/styles/common";
import { fmtScore } from "@/utils";

import { ReactNode } from "react";

import { Card, Group, Text } from "@mantine/core";

export type FeedbackCategory = { rank: number; score: number; points: number };

// The rows of a category are plain data, so their content doesn't depend on the card around it.
export type FeedbackRow = {
  key: string;
  content: ReactNode;
};

type CategoryStatsProps = {
  category: FeedbackCategory;
};

// "Score 64.00 · Points 14.38 · Rank #20"; a dot stays with the pair before it, so a
// wrapped line never starts with one
const CategoryStats = ({ category }: CategoryStatsProps) => {
  const stats = [
    { label: "Score", value: fmtScore(category.score) },
    { label: "Points", value: fmtScore(category.points) },
    { label: "Rank", value: `#${category.rank}` },
  ];

  return (
    <Group gap="xs">
      {stats.map(({ label, value }, index) => (
        <Group key={label} gap="xs" wrap="nowrap">
          <Text>
            <Text span c="dimmed">
              {label}
            </Text>{" "}
            {value}
          </Text>
          {index < stats.length - 1 && <Text c="dimmed">·</Text>}
        </Group>
      ))}
    </Group>
  );
};

type FeedbackCardProps = {
  title: string;
  category: FeedbackCategory;
  rows: FeedbackRow[];
};

const FeedbackCard = ({ title, category, rows }: FeedbackCardProps) => {
  return (
    <Card {...cardProps}>
      <CardHeader
        title={title}
        actions={<CategoryStats category={category} />}
      />
      {rows.map(({ key, content }) => (
        <Card.Section key={key} {...cardSectionProps}>
          {content}
        </Card.Section>
      ))}
    </Card>
  );
};

export default FeedbackCard;
