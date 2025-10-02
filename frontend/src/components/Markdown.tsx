import ReactMarkdown from "react-markdown";

import { Box } from "@mantine/core";

import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

type Markdown = {
  content: string;
  allowHtml?: boolean;
};

const Markdown = ({ content, allowHtml }: Markdown) => {
  return (
    <Box>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={allowHtml ? [rehypeRaw] : []}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default Markdown;
