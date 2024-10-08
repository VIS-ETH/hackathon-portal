import { Event } from "@/api/gen/schemas";
import {
  cardProps,
  iconProps
} from "@/styles/common";

import { Card, Group, Text } from "@mantine/core";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";

type EventCardProps = {
  event: Event;
};

const EventCard = ({ event }: EventCardProps) => {
  return (
    <Link href={`/events/${event.slug}`}>
      <Card {...cardProps}>
        <Group justify="space-between">
          <Text fw={600}>{event.name}</Text>
          <IconChevronRight {...iconProps} />
        </Group>
      </Card>
    </Link>
  );
};

export default EventCard;
