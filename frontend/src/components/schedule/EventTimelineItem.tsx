import Markdown from "../Markdown";
import UpdateAppointmentDrawer from "./UpdateAppointmentDrawer";

import { useDeleteAppointment } from "@/api/gen";
import { Appointment } from "@/api/gen/schemas";
import { cardProps, iconProps, secondaryButtonProps } from "@/styles/common";

import { FormattedDate, FormattedDateTimeRange } from "react-intl";

import { Button, Card, Group, Spoiler, Text, Timeline } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconPencil, IconTrash } from "@tabler/icons-react";

type EventTimelineItemProps = {
  appointment: Appointment;
  manage?: boolean;
  refetch?: () => void;
};

const EventTimelineItem = ({
  appointment,
  manage,
  refetch,
}: EventTimelineItemProps) => {
  const [opened, handles] = useDisclosure();
  const deleteMutation = useDeleteAppointment();

  const handleDelete = async () => {
    const confirm = window.confirm(
      `Are you sure you want to delete "${appointment.title}"?`,
    );

    if (!confirm) {
      return;
    }

    await deleteMutation.mutateAsync({ appointmentId: appointment.id });
    refetch?.();
  };

  return (
    <>
      <Timeline.Item title={appointment.title}>
        <Card {...cardProps} mt="sm" p="sm">
          <Text size="sm">
            {appointment.end ? (
              <FormattedDateTimeRange
                from={new Date(`${appointment.start}Z`)}
                to={new Date(`${appointment.end}Z`)}
                dateStyle="short"
                timeStyle="short"
              />
            ) : (
              <FormattedDate
                value={new Date(`${appointment.start}Z`)}
                dateStyle="short"
                timeStyle="short"
              />
            )}
          </Text>
          <Text c="dimmed" size="sm">
            {appointment.description}
          </Text>
          {appointment.content && (
            <Spoiler
              mt="sm"
              maxHeight={0}
              showLabel="Show more"
              hideLabel="Hide"
              styles={{
                control: {
                  textDecoration: "none",
                },
              }}
            >
              <Markdown content={appointment.content} />
            </Spoiler>
          )}
        </Card>
        {manage && (
          <Group mt="sm" gap="xs" justify="end">
            <Button
              {...secondaryButtonProps}
              leftSection={<IconPencil {...iconProps} />}
              onClick={handles.open}
            >
              Update
            </Button>
            <Button
              {...secondaryButtonProps}
              color="red"
              leftSection={<IconTrash {...iconProps} />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Group>
        )}
      </Timeline.Item>
      <UpdateAppointmentDrawer
        appointment={appointment}
        opened={opened}
        onClose={handles.close}
        refetch={refetch}
      />
    </>
  );
};

export default EventTimelineItem;
