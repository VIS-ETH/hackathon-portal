import MarkdownCard from "./MarkdownCard";

import { cardProps } from "@/styles/common";

import { Card, Divider, Text } from "@mantine/core";

type DrawerMarkdownProps = {
  content?: string | null;
};

const DrawerMarkdown = ({ content }: DrawerMarkdownProps) => {
  return (
    <>
      {/* the drawer body's padding, so the divider spans the whole drawer */}
      <Divider mx="-md" />
      {content ? (
        <MarkdownCard trusted content={content} />
      ) : (
        <Card {...cardProps}>
          <Text c="dimmed">Nothing to preview</Text>
        </Card>
      )}
    </>
  );
};

export default DrawerMarkdown;
