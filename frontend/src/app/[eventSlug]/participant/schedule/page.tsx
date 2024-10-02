"use client";

import { Appointment, useGetAppointments, useGetEventRoles } from "@/api/gen";
import CreateAppointment from "@/componentes/TimelineCreate";
import TimeSchedule from "@/componentes/TimelineEntry";
import TimelineEntry from "@/componentes/TimelineEntry";

import { useEffect, useState } from "react";

import { Button, Flex, Modal, Stack, Text, Timeline } from "@mantine/core";

import { useListState } from "@mantine/hooks";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function Page() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const event_id = "fae4d7ff-ee08-4e16-8802-a1b1797145d5";

  const { data: appointments, refetch } = useGetAppointments({
    event_id: event_id,
  });
  const { data: roles } = useGetEventRoles(event_id);

  const [active, setActive] = useState(-1);

  const update_timeline = () => {
    if (appointments) {
      const now = new Date();
      const before = appointments.filter(
        (item) => new Date(item.start) < now,
      ).length;
      setActive(before);
    }
  };

  useEffect(() => {
    update_timeline();
  }, [appointments]);

  return (
    <Stack>
      <Flex justify={"end"}>
        <CreateAppointment event_id={event_id} refetch={refetch} />
      </Flex>
      <Timeline active={active} bulletSize={24} lineWidth={4}>
        {appointments?.map((item, index) => (
          <Timeline.Item>
            <TimelineEntry
              index={index}
              key={index}
              item={item}
              edit
              refetch={refetch}
            />
          </Timeline.Item>
        ))}
      </Timeline>
    </Stack>
  );
}
