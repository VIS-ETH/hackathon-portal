"use client";

import { useGetAppointments } from "@/api/gen";
import PageSkeleton from "@/components/PageSkeleton";
import CreateAppointmentDrawer from "@/components/schedule/CreateAppointmentDrawer";
import EventTimeline from "@/components/schedule/EventTimeline";
import { useResolveParams } from "@/hooks/useResolveParams";
import { iconProps, secondaryButtonProps } from "@/styles/common";

import { Button, Group, Stack, Title } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconPlus } from "@tabler/icons-react";

const Documentation = () => {
  const [opened, handles] = useDisclosure();

  const { event, policies } = useResolveParams();

  const { data: appointments, refetch: refetchAppointments } =
    useGetAppointments({
      event_id: event?.id ?? "",
    });

  if (!event || !policies || !appointments) {
    return <PageSkeleton />;
  }

  return (
    <>
      <Stack>
        <Group justify="space-between">
          <Title order={2}>Schedule</Title>
          {policies.can_manage_event && (
            <Button
              {...secondaryButtonProps}
              leftSection={<IconPlus {...iconProps} />}
              onClick={handles.open}
            >
              Create
            </Button>
          )}
        </Group>
        <EventTimeline
          appointments={appointments}
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

export default Documentation;
