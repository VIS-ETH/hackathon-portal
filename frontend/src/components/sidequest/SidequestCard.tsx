import LinkCard from "../LinkCard";

import { useGetEvent } from "@/api/gen";
import { Sidequest } from "@/api/gen/schemas";

type SidequestCardProps = {
  sidequest: Sidequest;
};

const SidequestCard = ({ sidequest }: SidequestCardProps) => {
  const { data: event } = useGetEvent(sidequest.event_id);

  return (
    <LinkCard
      href={`/events/${event?.slug}/sidequests/${sidequest.slug}`}
      title={sidequest.name}
    />
  );
};

export default SidequestCard;
