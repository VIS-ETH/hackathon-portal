import Markdown from "./Markdown";

import { cardProps } from "@/styles/common";

import { Card } from "@mantine/core";

type MarkdownCardProps = {
  content: string;
  allowHtml?: boolean;
};

const MarkdownCard = ({ content, allowHtml }: MarkdownCardProps) => {
  return (
    <Card {...cardProps} py={0}>
      <Markdown content={content} allowHtml={allowHtml} />
    </Card>
  );
};

export default MarkdownCard;
