import EventTimelineItem from "./EventTimelineItem";

import { Appointment } from "@/api/gen/schemas";

import { useState } from "react";
import { FormattedDate } from "react-intl";

import { Stack, Text, Timeline, Title } from "@mantine/core";

type EventTimelineProps = {
  appointments: Appointment[];
  showAll: boolean;
  manage?: boolean;
  refetch?: () => void;
};

const EventTimeline = ({
  appointments,
  showAll,
  manage,
  refetch,
}: EventTimelineProps) => {
  const [now] = useState(new Date());

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

  return filteredAppointments.length ? (
    <Stack gap="xl">
      {sortedDates.map((dateKey) => (
        <Stack key={dateKey}>
          <Title order={3}>
            <FormattedDate
              value={new Date(dateKey)}
              weekday="long"
              day="numeric"
              month="long"
            />
          </Title>
          <Timeline lineWidth={2}>
            {groupedAppointments[dateKey].map((appointment) => (
              <EventTimelineItem
                key={appointment.id}
                appointment={appointment}
                manage={manage}
                refetch={refetch}
              />
            ))}
          </Timeline>
        </Stack>
      ))}
    </Stack>
  ) : (
    <Text c="dimmed">No appointments found</Text>
  );
};

export default EventTimeline;
