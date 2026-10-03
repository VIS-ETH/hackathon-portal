import {
  badgeProps,
  cardProps,
  highlightedCardProps,
  iconProps,
} from "@/styles/common";

import { ReactNode } from "react";

import { Badge, Box, Card, Group, Text } from "@mantine/core";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";

type LinkCardProps = {
  href: string;
  title: string;
  highlight?: boolean;
  /** Rendered before the title, e.g. an index. */
  prefix?: ReactNode;
  /**
   * Middle column, shown from `sm`. When not `undefined`, the title gets a
   * fixed share of the row so details line up across cards; pass `null` to
   * keep the column but leave it empty.
   */
  detail?: ReactNode;
  /** Labels shown before the chevron; `mobile` ones are also shown below `sm`. */
  badges?: { label: string; mobile?: boolean }[];
};

const LinkCard = ({
  href,
  title,
  highlight,
  prefix,
  detail,
  badges,
}: LinkCardProps) => {
  const withDetail = detail !== undefined;

  return (
    <Link href={href}>
      <Card {...(highlight ? highlightedCardProps : cardProps)}>
        <Group wrap="nowrap">
          {/* Title: fills the row, or a fixed share from sm when there is a detail column */}
          <Group
            wrap="nowrap"
            flex={withDetail ? { base: 1, sm: "0 1 33%" } : 1}
            miw={0}
          >
            {prefix}
            <Text fw={600} truncate>
              {title}
            </Text>
          </Group>
          {/* Detail: always rendered from sm so the badges stay right-aligned */}
          {withDetail && (
            <Box flex={1} miw={0} visibleFrom="sm">
              {detail}
            </Box>
          )}
          {/* Badges: sized to content, never shrinks */}
          <Group wrap="nowrap" flex="none">
            {badges?.map(({ label, mobile }) => (
              <Badge
                key={label}
                {...badgeProps}
                visibleFrom={mobile ? undefined : "sm"}
              >
                {label}
              </Badge>
            ))}
            <IconChevronRight {...iconProps} />
          </Group>
        </Group>
      </Card>
    </Link>
  );
};

export default LinkCard;
