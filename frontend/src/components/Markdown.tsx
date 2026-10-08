import ReactMarkdown, { Components } from "react-markdown";

import { Anchor, Box } from "@mantine/core";

import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

type Markdown = {
  content: string;
  allowHtml?: boolean;
  trusted?: boolean;
};

const trustedComponents: Components = {
  a: ({ href, children }) => (
    <Anchor inherit td="underline dotted" c="inherit" href={href}>
      {children}
    </Anchor>
  ),
};

const untrustedComponents: Components = {
  a: ({ href, children }) => (
    <Anchor
      inherit
      td="underline dotted"
      c="inherit"
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
    >
      {children}
    </Anchor>
  ),
};

const Markdown = ({ content, allowHtml, trusted }: Markdown) => {
  return (
    <Box>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={allowHtml && trusted ? [rehypeRaw] : []}
        disallowedElements={trusted ? undefined : ["img"]}
        components={trusted ? trustedComponents : untrustedComponents}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default Markdown;
