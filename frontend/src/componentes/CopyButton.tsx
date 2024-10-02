import { ActionIcon, CopyButton, Tooltip } from "@mantine/core";

import { IconCheck, IconCopy } from "@tabler/icons-react";

type MyCopyButtonProps = {
  text: string;
};

const MyCopyButton = ({ text }: MyCopyButtonProps) => {
  return (
    <CopyButton value={text} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? "Copied" : "Copy"} withArrow position="right">
          <ActionIcon
            color={copied ? "teal" : "gray"}
            variant="subtle"
            onClick={copy}
            size={"xs"}
          >
            {copied ? <IconCheck /> : <IconCopy />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
};

export default MyCopyButton;
