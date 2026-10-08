import LinkCard from "../LinkCard";

import { Sidequest } from "@/api/gen/schemas";

type SidequestCardProps = {
  eventSlug: string;
  sidequest: Sidequest;
};

const SidequestCard = ({ eventSlug, sidequest }: SidequestCardProps) => {
  return (
    <LinkCard
      href={`/events/${eventSlug}/sidequests/${sidequest.slug}`}
      title={sidequest.name}
    />
  );
};

export default SidequestCard;
