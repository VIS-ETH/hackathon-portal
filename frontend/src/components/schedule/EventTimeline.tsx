import EventTimelineItem from "./EventTimelineItem";

import { Appointment } from "@/api/gen/schemas";
import { cardProps } from "@/styles/common";

import { useState } from "react";
import { FormattedDate } from "react-intl";

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

  // Group appointments by day
  const groupedAppointments = filteredAppointments.reduce(
    (groups, appointment) => {
      const date = new Date(`${appointment.start}Z`);
      const dateKey = date.toDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(appointment);

      return groups;
    },
    {} as Record<string, Appointment[]>,
  );

  const sortedDates = Object.keys(groupedAppointments).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  const renderDayTimelines = () => {
    return sortedDates.map((dateKey, dayIndex) => {
      const appointmentsForDay = groupedAppointments[dateKey];
      const date = new Date(dateKey);

      return (
        <div key={dateKey}>
          <Text size="xl" fw={600} mb="md" mt={dayIndex > 0 ? "xl" : undefined}>
            <FormattedDate
              value={date}
              weekday="long"
              day="numeric"
              month="long"
            />
          </Text>

          <Timeline lineWidth={2} mb="xl">
            {appointmentsForDay.map((appointment) => (
              <EventTimelineItem
                key={appointment.id}
                appointment={appointment}
                manage={manage}
                refetch={refetch}
              />
            ))}
          </Timeline>
        </div>
      );
    });
  };

  return (
    <>
      <Switch
        label={`Show all (${appointments.length})`}
        checked={showAll}
        onChange={(event) => setShowAll(event.currentTarget.checked)}
      />
      {filteredAppointments.length ? (
        <div>{renderDayTimelines()}</div>
      ) : (
        <Card {...cardProps} style={{ borderStyle: "dashed" }}>
          <Text>No appointments found</Text>
        </Card>
      )}
    </>
  );
};

export default EventTimeline;
