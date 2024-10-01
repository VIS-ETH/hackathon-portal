import CreateAppointment from "./TimelineCreate";

import {
  Appointment,
  AppointmentForUpdate,
  useDeleteAppointment,
  useUpdateAppointment,
} from "@/api/gen";

import { useState } from "react";

import {
  ActionIcon,
  Box,
  Button,
  ButtonGroup,
  Flex,
  Grid,
  Modal,
  Stack,
  TextInput,
  Textarea,
} from "@mantine/core";

import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";

import { IconEdit, IconTrash } from "@tabler/icons-react";

type TimelineEntryProps = {
  appointment: Appointment;
  refetch: () => void;
};

const UpdateAppointment = ({ appointment, refetch }: TimelineEntryProps) => {
  const updateQuery = useUpdateAppointment(appointment.id);
  const delteQuery = useDeleteAppointment(appointment.id);
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm<AppointmentForUpdate>({
    initialValues: {
      title: appointment.title,
      description: appointment.description,
      start: appointment.start,
      end: appointment.end,
      content: appointment.content || "",
    },
    validate: {
      title: (value) =>
        value && value.length < 2 ? "Title must have at least 2 letters" : null,
    },
  });

  const submit = () => {
    updateQuery.mutate(
      {
        title: form.values.title,
        description: form.values.description,
        start: form.values.start?.replace("Z", ""),
        end: form.values.end?.replace("Z", ""),
        content: form.values.content,
      },
      {
        onSuccess: (data) => {
          form.setInitialValues(data);
          form.reset();
          refetch();
          close();
        },
        onError: (error) => {
          alert(error);
        },
      },
    );
  };

  const remove = () => {
    delteQuery.mutate(null as never, {
      onSuccess: () => {
        refetch();
        close();
      },
      onError: (error) => {
        alert(error);
      },
    });
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        size={"xl"}
        title="Update Appointment"
      >
        <form onSubmit={submit}>
          <Stack gap={"md"}>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  {...form.getInputProps("title")}
                  placeholder="Meeting"
                  label="Title"
                />
                <TextInput
                  {...form.getInputProps("description")}
                  placeholder="Half time meeting with stakeholders"
                  label="Description"
                />
                <DateTimePicker
                  suppressHydrationWarning
                  label="Start"
                  value={
                    form.values.start ? new Date(form.values.start) : undefined
                  }
                  onChange={(value) => {
                    if (!value) return;
                    form.setFieldValue("start", value.toISOString() || "");
                  }}
                />
                <DateTimePicker
                  suppressHydrationWarning
                  label="End"
                  value={
                    form.values.end ? new Date(form.values.end) : undefined
                  }
                  onChange={(value) => {
                    if (!value) return;
                    form.setFieldValue("end", value.toISOString());
                  }}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Textarea
                  h={"100%"}
                  minRows={4}
                  autosize
                  {...form.getInputProps("content")}
                  placeholder="Exact location and time"
                  label="Details"
                />
              </Grid.Col>
            </Grid>

            <Flex justify={"space-between"} align={"center"}>
              <Box>
              </Box>
              <ButtonGroup>
                <Button onClick={close} color="gray">
                  Cancel
                </Button>

                <Button onClick={submit}>Update</Button>
              </ButtonGroup>
              <ActionIcon onClick={remove}>
                <IconTrash />
              </ActionIcon>
            </Flex>
          </Stack>
        </form>
      </Modal>
      <ActionIcon onClick={open}>
        <IconEdit />
      </ActionIcon>
    </>
  );
};

export default UpdateAppointment;
