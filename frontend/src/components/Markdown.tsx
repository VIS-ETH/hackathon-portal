import ReactMarkdown, { Components } from "react-markdown";

import { Box } from "@mantine/core";

import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

type Markdown = {
  content: string;
  allowHtml?: boolean;
  trusted?: boolean;
};

const untrustedComponents: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc">
      {children}
    </a>
  ),
};

const Markdown = ({ content, allowHtml, trusted }: Markdown) => {
  return (
    <Box>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={allowHtml && trusted ? [rehypeRaw] : []}
        disallowedElements={trusted ? undefined : ["img"]}
        components={trusted ? undefined : untrustedComponents}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default Markdown;
