import CreateAppointment from "./TimelineCreate";

import {
  Appointment,
  AppointmentForCreate,
  AppointmentForUpdate,
  UpdateAppointmentMutationRequest,
  useCreateAppointment,
  useDeleteAppointment,
  useGetAppointment,
  useGetAppointments,
  useUpdateAppointment,
} from "@/api/gen";

import {
  ActionIcon,
  Button,
  Card,
  Flex,
  Grid,
  Group,
  Modal,
  Stack,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";

import { DatePicker, DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";

import { IconDeviceFloppy, IconPlus, IconTrash } from "@tabler/icons-react";
import { produce } from "immer";
import { useParams } from "next/navigation";

const AppointmentCreate = ({
  event_id,
  refetch,
}: {
  event_id: string;
  refetch: () => void;
}) => {
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

const AppointmentDetail = ({
  appointment,
  refetch,
}: {
  appointment: Appointment;
  refetch: () => void;
}) => {
  const form = useForm<AppointmentForUpdate>({
    mode: "controlled",
    transformValues: (values) =>
      produce(values, (draft) => {
        if ((draft.end as any) === "") {
          draft.end = null;
        }
        if ((draft.content as any) === "") {
          draft.content = null;
        }
        if ((draft.description as any) === "") {
          draft.description = null;
        }
        if ((draft.end as any) === "") {
          draft.end = null;
        }
        if ((draft.start as any) === "") {
          draft.start = null;
        }

        if ((draft.title as any) === "") {
          draft.title = null;
        }

        return draft;
      }),
  });

  const updateWorkerMutation = useUpdateAppointment(appointment.id);
  const deleteWorkerMutation = useDeleteAppointment(appointment.id);

  //   useEffect(() => {
  //     form.reset();
  //   }, [poi, worker, reset]);

  const updateWorker = async (payload: UpdateAppointmentMutationRequest) => {
    await updateWorkerMutation.mutateAsync(payload, {
      onSuccess: () => {
        form.reset();
        refetch();
      },
    });
    // onClose();
  };

  const deleteWorker = async () => {
    await deleteWorkerMutation.mutateAsync(null as never, {
      onSuccess: () => {
        refetch();
      },
    });
    // onClose();
  };

  return (
    <Card withBorder>
      <form onSubmit={form.onSubmit(updateWorker)}>
        <Flex justify={"space-between"}>
          <TextInput
            label="Title"
            {...form.getInputProps("title")}
            placeholder={appointment.title}
          />
          <Group>
            <ActionIcon type="submit">
              <IconDeviceFloppy />
            </ActionIcon>
            <ActionIcon onClick={deleteWorker}>
              <IconTrash />
            </ActionIcon>
          </Group>
        </Flex>
        <Group grow>
          <DateTimePicker
            label="Start"
            {...form.getInputProps("start")}
            placeholder={appointment.start}
          />
          <DateTimePicker
            label="End"
            {...form.getInputProps("end")}
            placeholder={appointment.end ? appointment.end : undefined}
          />
        </Group>
        <TextInput
          label="Description"
          {...form.getInputProps("description")}
          placeholder={appointment.description ?? undefined}
        />
        <Textarea
          label="Content"
          {...form.getInputProps("content")}
          placeholder={appointment.content ?? undefined}
        />
      </form>
    </Card>
  );
};

const AppointmentManagement = () => {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const event_id = "fae4d7ff-ee08-4e16-8802-a1b1797145d5";

  const { data: schedule, refetch } = useGetAppointments({
    event_id: event_id,
  });
  const create_appointment = useCreateAppointment();

  return (
    <Stack>
      <Flex justify={"space-between"} align={"center"}>
        <Title order={2}>Manage Schedule</Title>{" "}
        <CreateAppointment event_id={event_id} refetch={refetch} />
      </Flex>
      {schedule &&
        schedule.map((appointment) => (
          <AppointmentDetail appointment={appointment} refetch={refetch} />
        ))}
    </Stack>
  );
};

export default AppointmentManagement;
