import { badgeProps, iconProps } from "@/styles/common";

import { Badge } from "@mantine/core";

import { useClipboard } from "@mantine/hooks";

import { IconClipboard } from "@tabler/icons-react";

export type IdName = {
  id: string;
  name: string;
};

type BadgeArrayItemProps = {
  item: IdName;
  index: number;
  indexed?: boolean;
};

const BadgeArrayItem = ({ item, index, indexed }: BadgeArrayItemProps) => {
  const { copy, copied } = useClipboard();

  return (
    <Badge
      {...badgeProps}
      onClick={() => copy(item.id)}
      styles={{ label: { textOverflow: "initial" } }}
    >
      {copied ? (
        <IconClipboard {...iconProps} size={12} />
      ) : indexed ? (
        `${index + 1} ${item.name}`
      ) : (
        item.name
      )}
    </Badge>
  );
};

export default BadgeArrayItem;
