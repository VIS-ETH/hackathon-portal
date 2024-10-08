import { iconProps as defaultIconProps } from "@/styles/common";

import { ComponentType, PropsWithChildren } from "react";

import { Group } from "@mantine/core";

import { IconProps } from "@tabler/icons-react";

type IconTextGroupProps = PropsWithChildren & {
  Icon: ComponentType<IconProps>;
  iconProps?: IconProps;
  lg?: boolean;
};

const IconTextGroup = ({
  Icon,
  iconProps,
  lg,
  children,
}: IconTextGroupProps) => {
  return (
    <Group gap={lg ? "md" : "xs"}>
      <Icon
        {...defaultIconProps}
        {...iconProps}
        {...(lg ? { size: 24 } : {})}
      />
      {children}
    </Group>
  );
};

export default IconTextGroup;
