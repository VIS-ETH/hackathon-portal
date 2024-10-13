import EventTimelineItem from "./EventTimelineItem";

import { Appointment } from "@/api/gen/schemas";
import { cardProps } from "@/styles/common";

import { useState } from "react";

import { Card, Switch, Text, Timeline } from "@mantine/core";

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
  const [now] = useState(new Date());
  const [showAll, setShowAll] = useState(false);

  // Events will be shown for 30 minutes after they end
  const grace = 1000 * 60 * 30;

  const isInPast = (timestamp: string) => {
    const date = new Date(`${timestamp}Z`);
    return date.getTime() < now.getTime() - grace;
  };

  const filteredAppointments = appointments.filter((appointment) => {
    return showAll || !isInPast(appointment.end ?? appointment.start);
  });

  return (
    <>
      <Switch
        label={`Show all (${appointments.length})`}
        checked={showAll}
        onChange={(event) => setShowAll(event.currentTarget.checked)}
      />
      {filteredAppointments.length ? (
        <Timeline lineWidth={2}>
          {filteredAppointments.map((appointment) => (
            <EventTimelineItem
              key={appointment.id}
              appointment={appointment}
              manage={manage}
              refetch={refetch}
            />
          ))}
        </Timeline>
      ) : (
        <Card {...cardProps} style={{ borderStyle: "dashed" }}>
          <Text>No appointments found</Text>
        </Card>
      )}
    </>
  );
};

export default EventTimeline;
