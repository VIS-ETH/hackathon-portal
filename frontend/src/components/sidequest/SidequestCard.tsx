import { useGetEvent } from "@/api/gen";
import { Sidequest } from "@/api/gen/schemas";
import { cardProps, iconProps } from "@/styles/common";

import { Card, Group, Text } from "@mantine/core";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";

type SidequestCardProps = {
  sidequest: Sidequest;
};

const SidequestCard = ({ sidequest }: SidequestCardProps) => {
  const { data: event } = useGetEvent(sidequest.event_id);

  return (
    <Link href={`/events/${event?.slug}/sidequests/${sidequest.slug}`}>
      <Card {...cardProps}>
        <Group justify="space-between">
          <Text fw={600}>{sidequest.name}</Text>
          <IconChevronRight {...iconProps} />
        </Group>
      </Card>
    </Link>
  );
};

export default SidequestCard;
