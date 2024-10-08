import {
  BadgeProps,
  ButtonProps,
  CSSProperties,
  CardProps,
  CardSectionProps,
  ContainerProps,
  InputProps,
  PolymorphicComponentProps,
  SegmentedControlProps,
  SkeletonProps,
  TextProps,
  TextareaProps,
} from "@mantine/core";

import { IconProps } from "@tabler/icons-react";

export const containerProps: ContainerProps = {
  size: "md",
};

export const inputProps: InputProps = {
  size: "md",
  radius: "md",
};

export const textareaProps: TextareaProps = {
  size: "md",
  radius: "md",
  minRows: 5,
  maxRows: 15,
  autosize: true,
};

export const segmentedControlProps: SegmentedControlProps = {
  size: "sm",
  radius: "md",
  withItemsBorders: false,
  data: [],
};

export const primaryButtonProps: ButtonProps = {
  radius: "md",
  size: "md",
};

export const secondaryButtonProps: ButtonProps = {
  radius: "md",
  size: "xs",
};

export const cardProps: PolymorphicComponentProps<any, CardProps> = {
  withBorder: true,
  radius: "md",
  padding: "md",
};

export const highlightedCardProps: PolymorphicComponentProps<any, CardProps> = {
  ...cardProps,
  withBorder: false,
  bg: "var(--mantine-color-primary-0)",
};

export const cardSectionProps: PolymorphicComponentProps<
  any,
  CardSectionProps
> = {
  p: "md",
  withBorder: true,
};

export const cardHeaderSectionProps: PolymorphicComponentProps<
  any,
  CardSectionProps
> = {
  py: "xs",
  inheritPadding: true,
  withBorder: true,
};

export const cardHeaderTextProps: PolymorphicComponentProps<any, TextProps> = {
  fw: 700,
  truncate: true,
};

export const badgeProps: PolymorphicComponentProps<any, BadgeProps> = {
  variant: "default",
  radius: "sm",
};

export const indicatorBadgeProps: PolymorphicComponentProps<any, BadgeProps> = {
  ...badgeProps,
  variant: "dot",
};

export const iconProps: IconProps = {
  size: 16,
  stroke: 1.5,
};

export const skeletonProps: SkeletonProps = {
  height: 24,
  radius: "md",
};

export const cursorPointerStyle: CSSProperties = {
  cursor: "pointer",
};

export const fullSizeDivStyle: CSSProperties = {
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  position: "fixed",
};

export const linkStyle: CSSProperties = {
  textDecoration: "none",
  color: "inherit",
};
