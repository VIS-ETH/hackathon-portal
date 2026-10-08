"use client";

import { useGetAppointments } from "@/api/gen";
import PageSkeleton from "@/components/PageSkeleton";
import CreateAppointmentDrawer from "@/components/schedule/CreateAppointmentDrawer";
import EventTimeline from "@/components/schedule/EventTimeline";
import { useResolveParams } from "@/hooks/useResolveParams";
import { iconProps, secondaryButtonProps } from "@/styles/common";

import { useState } from "react";

import { Button, Group, Stack, Switch, Title } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconPlus } from "@tabler/icons-react";

const Schedule = () => {
  const [opened, handles] = useDisclosure();
  const [showAll, setShowAll] = useState(false);

  const { event, policies } = useResolveParams();

  const { data: appointments, refetch: refetchAppointments } =
    useGetAppointments(
      {
        event_id: event?.id ?? "",
      },
      {
        query: { enabled: !!event },
      },
    );

  if (!event || !policies || !appointments) {
    return <PageSkeleton />;
  }

  return (
    <>
      <Stack>
        <Group justify="space-between">
          <Title order={2}>Schedule</Title>
          <Group>
            {policies.can_manage_event && (
              <Button
                {...secondaryButtonProps}
                leftSection={<IconPlus {...iconProps} />}
                onClick={handles.open}
              >
                Create
              </Button>
            )}
            <Switch
              label={`Show all (${appointments.length})`}
              checked={showAll}
              onChange={(event) => setShowAll(event.currentTarget.checked)}
            />
          </Group>
        </Group>
        <EventTimeline
          appointments={appointments}
          showAll={showAll}
          manage={policies.can_manage_event}
          refetch={refetchAppointments}
        />
      </Stack>
      <CreateAppointmentDrawer
        eventId={event.id}
        opened={opened}
        onClose={handles.close}
        refetch={refetchAppointments}
      />
    </>
  );
};

export default Schedule;
