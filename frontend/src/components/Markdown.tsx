import ReactMarkdown from "react-markdown";

import { Box } from "@mantine/core";

import remarkGfm from "remark-gfm";

type Markdown = {
  content: string;
};

const Markdown = ({ content }: Markdown) => {
  return (
    <Box>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </Box>
  );
};

export default Markdown;
