"use client";

import {
  Appointment,
  AppointmentForCreate,
  AppointmentForUpdate,
  useCreateAppointment,
  useGetAppointments,
  useUpdateAppointment,
} from "@/api/gen";
import TimelineEntry from "@/componentes/TimelineEntry";

import { useState } from "react";

import {
  ActionIcon,
  Button,
  ButtonGroup,
  Card,
  Center,
  Flex,
  Grid,
  Modal,
  Stack,
  TextInput,
  Textarea,
  Timeline,
  TimelineItem,
} from "@mantine/core";

import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";

import { IconEdit, IconHexagonPlus, IconPlus } from "@tabler/icons-react";
import dynamic from "next/dynamic";

type CreateAppointmentProps = {
  event_id: string;
  refetch: () => void;
};

const CreateAppointment = ({ event_id, refetch }: CreateAppointmentProps) => {
  const postAppointment = useCreateAppointment();
  //   const [visible, setVisible] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm<AppointmentForCreate>({
    initialValues: {
      event_id: event_id,
      title: "",
      description: "",
      start: new Date().toISOString(),
      end: undefined,
      content: "",
    },
    validate: {
      title: (value) =>
        value.length < 2 ? "Title must have at least 2 letters" : null,
    },
  });

  const submit = () => {
    if (form.validate().hasErrors) return;

    postAppointment.mutate(
      {
        event_id: form.values.event_id,
        title: form.values.title,
        description: form.values.description,
        start: form.values.start.replace("Z", ""),
        end: form.values.end?.replace("Z", ""),
      },
      {
        onSuccess: () => {
          form.reset();
          close();
          refetch();
        },
        onError: (error) => {
          alert(error);
        },
      },
    );
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title="Create an Appointment"
        size={"xl"}
      >
        <form onSubmit={submit}>
          <Stack gap={"md"}>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  withAsterisk
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
                  withAsterisk
                  suppressHydrationWarning
                  label="Start"
                  value={new Date(form.values.start)}
                  onChange={(value) =>
                    form.setFieldValue("start", value?.toISOString() || "")
                  }
                />
                <DateTimePicker
                  suppressHydrationWarning
                  label="End"
                  value={
                    form.values.end ? new Date(form.values.end) : undefined
                  }
                  onChange={(value) =>
                    form.setFieldValue("end", value?.toISOString() || "")
                  }
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

            <Flex justify={"center"}>
              <Button.Group>
                <Button
                  onClick={() => {
                    form.reset();
                    close();
                  }}
                  color="gray"
                >
                  Cancel
                </Button>
                <Button onClick={submit}>Create</Button>
              </Button.Group>
            </Flex>
          </Stack>
        </form>
      </Modal>

      <ActionIcon onClick={open}>
        <IconPlus />
      </ActionIcon>
    </>
  );
};

export default CreateAppointment;
