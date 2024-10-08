import EventTimelineItem from "./EventTimelineItem";

import { Appointment } from "@/api/gen/schemas";

import { Timeline } from "@mantine/core";

type EventTimelineProps = {
  appointments: Appointment[];
  manage?: boolean;
  refetch?: () => void;
};

const EventTimeline = ({
  appointments,
  manage,
  refetch,
}: EventTimelineProps) => {
  return (
    <Timeline lineWidth={2}>
      {appointments.map((appointment) => (
        <EventTimelineItem
          key={appointment.id}
          appointment={appointment}
          manage={manage}
          refetch={refetch}
        />
      ))}
    </Timeline>
  );
};

export default EventTimeline;
