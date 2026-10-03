import LinkCard from "../LinkCard";

import { Event } from "@/api/gen/schemas";

type EventCardProps = {
  event: Event;
};

const EventCard = ({ event }: EventCardProps) => {
  return <LinkCard href={`/events/${event.slug}`} title={event.name} />;
};

export default EventCard;
