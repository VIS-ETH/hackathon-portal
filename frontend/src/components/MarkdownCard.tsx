import Markdown from "./Markdown";

import { cardProps } from "@/styles/common";

import { Card } from "@mantine/core";

type MarkdownCardProps = {
  content: string;
  allowHtml?: boolean;
  trusted?: boolean;
};

const MarkdownCard = ({ content, allowHtml, trusted }: MarkdownCardProps) => {
  return (
    <Card {...cardProps} py={0}>
      <Markdown content={content} allowHtml={allowHtml} trusted={trusted} />
    </Card>
  );
};

export default MarkdownCard;
