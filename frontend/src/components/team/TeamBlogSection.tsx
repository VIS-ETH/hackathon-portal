import Markdown from "../Markdown";

import { BlogSectionLayout } from "@/api/gen/schemas";

import { Grid, Image, Stack } from "@mantine/core";

type TeamBlogSectionProps = {
  content: string;
  layout: BlogSectionLayout;
  imageUrl?: string | null;
};

const TeamBlogSection = ({
  content,
  layout,
  imageUrl,
}: TeamBlogSectionProps) => {
  const markdown = <Markdown content={content} />;

  if (!imageUrl) {
    return markdown;
  }

  const image = (
    <Image src={imageUrl} w="100%" alt="Blog Image" fit="contain" />
  );

  switch (layout) {
    case "ImageTop":
      return (
        <Stack gap={0}>
          {image}
          {markdown}
        </Stack>
      );
    case "ImageBottom":
      return (
        <Stack gap={0}>
          {markdown}
          {image}
        </Stack>
      );
    case "ImageLeft":
    case "ImageRight":
      return (
        <Grid align="center">
          <Grid.Col
            span={{ base: 12, sm: 5 }}
            order={{ base: 1, sm: layout === "ImageLeft" ? 1 : 2 }}
          >
            {image}
          </Grid.Col>
          <Grid.Col
            span={{ base: 12, sm: 7 }}
            order={{ base: 2, sm: layout === "ImageLeft" ? 2 : 1 }}
          >
            {markdown}
          </Grid.Col>
        </Grid>
      );
  }
};

export default TeamBlogSection;
