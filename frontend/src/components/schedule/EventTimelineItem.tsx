import Markdown from "../Markdown";
import UpdateAppointmentDrawer from "./UpdateAppointmentDrawer";

import { useDeleteAppointment } from "@/api/gen";
import { Appointment } from "@/api/gen/schemas";
import { cardProps, iconProps, secondaryButtonProps } from "@/styles/common";

import { useState } from "react";
import { FormattedDate, FormattedDateTimeRange } from "react-intl";

import { Button, Card, Group, Text, Timeline } from "@mantine/core";

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
  const [showFullContent, setShowFullContent] = useState(false);
  const deleteMutation = useDeleteAppointment();

  const contentLength = 170;

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
                weekday="long"
                hour="2-digit"
                minute="2-digit"
              />
            ) : (
              <FormattedDate
                value={new Date(`${appointment.start}Z`)}
                weekday="long"
                hour="2-digit"
                minute="2-digit"
              />
            )}
          </Text>
          <Text c="dimmed" size="sm">
            {appointment.description}
          </Text>
          {appointment.content && (
            <>
              <Text size="sm" component="div" m={0}>
                <Markdown
                  content={
                    showFullContent ||
                    appointment.content.length <= contentLength
                      ? appointment.content
                      : appointment.content.substring(0, contentLength) + "..."
                  }
                />
              </Text>
              {appointment.content.length > contentLength && (
                <Text ta="left">
                  <Button
                    variant="subtle"
                    size="xs"
                    mt="xs"
                    p={0}
                    h="auto"
                    onClick={() => setShowFullContent(!showFullContent)}
                    styles={{
                      root: {
                        textDecoration: "none",
                      },
                    }}
                  >
                    {showFullContent ? "Show less" : "Show more"}
                  </Button>
                </Text>
              )}
            </>
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
