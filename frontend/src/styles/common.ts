import {
  BadgeProps,
  ButtonProps,
  CSSProperties,
  CardProps,
  CardSectionProps,
  ContainerProps,
  InputProps,
  MenuProps,
  ModalProps,
  SegmentedControlProps,
  SkeletonProps,
  TextProps,
  TextareaProps,
  TooltipProps,
} from "@mantine/core";

import { IconProps } from "@tabler/icons-react";

export const containerProps: Partial<ContainerProps> = {
  size: "md",
};

export const inputProps: Partial<InputProps> = {
  size: "md",
  radius: "md",
};

export const textareaProps: Partial<TextareaProps> = {
  size: "md",
  radius: "md",
  minRows: 5,
  maxRows: 15,
  autosize: true,
};

export const segmentedControlProps: Partial<SegmentedControlProps> = {
  size: "sm",
  radius: "md",
  withItemsBorders: false,
  data: [],
};

export const primaryButtonProps: Partial<ButtonProps> = {
  radius: "md",
  size: "md",
};

export const secondaryButtonProps: Partial<ButtonProps> = {
  radius: "md",
  size: "xs",
};

export const tooltipProps: Partial<TooltipProps> = {
  w: 200,
  multiline: true,
};

export const cardProps: Partial<CardProps> = {
  withBorder: true,
  radius: "md",
  padding: "md",
};

export const highlightedCardProps: Partial<CardProps> = {
  ...cardProps,
  withBorder: false,
  bg: "var(--mantine-color-primary-0)",
};

export const cardSectionProps: Partial<CardSectionProps> = {
  p: "md",
  withBorder: true,
};

export const cardHeaderSectionProps: Partial<CardSectionProps> = {
  py: "xs",
  inheritPadding: true,
  withBorder: true,
};

export const cardHeaderTextProps: Partial<TextProps> = {
  fw: 700,
  truncate: true,
};

export const badgeProps: Partial<BadgeProps> = {
  variant: "default",
  radius: "sm",
};

export const indicatorBadgeProps: Partial<BadgeProps> = {
  ...badgeProps,
  variant: "dot",
};

export const menuProps: Partial<MenuProps> = {
  radius: "md",
  shadow: "xl",
  position: "bottom-end",
  transitionProps: { transition: "pop-top-right" },
};

export const modalProps: Partial<ModalProps> = {
  radius: "md",
};

export const iconProps: Partial<IconProps> = {
  size: 16,
  stroke: 1.5,
};

export const largeIconProps: Partial<IconProps> = {
  ...iconProps,
  size: 52,
};

export const skeletonProps: Partial<SkeletonProps> = {
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

export const hiddenScrollbarStyle: CSSProperties = {
  overflowY: "scroll",
  msOverflowStyle: "none",
  scrollbarWidth: "none",
};
