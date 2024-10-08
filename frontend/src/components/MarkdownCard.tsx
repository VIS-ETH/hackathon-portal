import Markdown from "./Markdown";

import { cardProps } from "@/styles/common";

import { Card } from "@mantine/core";

type MarkdownCardProps = {
  content: string;
};

const MarkdownCard = ({ content }: MarkdownCardProps) => {
  return (
    <Card {...cardProps} py={0}>
      <Markdown content={content} />
    </Card>
  );
};

export default MarkdownCard;
