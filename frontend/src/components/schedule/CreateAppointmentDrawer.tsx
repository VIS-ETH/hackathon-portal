import DrawerMarkdown from "../DrawerMarkdown";
import { AppointmentFormValues } from "./UpdateAppointmentDrawer";

import { useCreateAppointment } from "@/api/gen";
import { AppointmentForCreate } from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  drawerProps,
  inputProps,
  primaryButtonProps,
  textareaProps,
} from "@/styles/common";
import { toUtcDate } from "@/utils/form";

import { useEffect } from "react";

import {
  Button,
  Checkbox,
  Drawer,
  Stack,
  TextInput,
  Textarea,
} from "@mantine/core";

import { DateTimePicker } from "@mantine/dates";
import { isNotEmpty, useForm } from "@mantine/form";

type CreateAppointmentDrawerProps = {
  eventId: string;
  opened: boolean;
  onClose: () => void;
  refetch?: () => void;
};

const CreateAppointmentDrawer = ({
  eventId,
  opened,
  onClose,
  refetch,
}: CreateAppointmentDrawerProps) => {
  const form = useForm<
    AppointmentFormValues,
    (values: AppointmentFormValues) => AppointmentForCreate
  >({
    mode: "controlled",
    initialValues: {
      title: "",
      description: "",
      content: "",
      start: "",
      end: "",
      setEnd: false,
    },
    validate: {
      title: isNotEmpty("Title must not be empty"),
      start: isNotEmpty("Start must not be empty"),
    },
    validateInputOnChange: true,
    transformValues: ({ setEnd, ...values }) => ({
      ...values,
      event_id: eventId,
      start: toUtcDate(values.start),
      end: setEnd && values.end ? toUtcDate(values.end) : null,
    }),
  });
  const createAppointmentMutation = useCreateAppointment();

  const confirmClose = useUnsavedChanges(form.isDirty());

  useEffect(() => {
    form.reset();
  }, [form.setInitialValues, form.reset, opened]);

  const handleSubmit = async (data: AppointmentForCreate) => {
    await createAppointmentMutation.mutateAsync({ data });
    refetch?.();
    form.reset();
    onClose();
  };

  return (
    <Drawer
      {...drawerProps}
      opened={opened}
      onClose={() => confirmClose() && onClose()}
      title="Create Appointment"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            {...inputProps}
            {...form.getInputProps("title")}
            label="Title"
            placeholder="Opening Ceremony"
            required
          />
          <TextInput
            {...inputProps}
            {...form.getInputProps("description")}
            label="Description"
            placeholder="Audimax (HG F30)"
          />
          <Textarea
            {...textareaProps}
            {...form.getInputProps("content")}
            label="Content"
            description="Supports Markdown"
          />
          <DateTimePicker
            {...inputProps}
            {...form.getInputProps("start")}
            label="Start"
            required
          />
          <Checkbox
            checked={form.getValues().setEnd}
            onChange={() =>
              form.setFieldValue("setEnd", !form.getValues().setEnd)
            }
            label="Set end"
          />
          {form.getValues().setEnd && (
            <DateTimePicker
              {...inputProps}
              {...form.getInputProps("end")}
              label="End"
            />
          )}
          <Button
            {...primaryButtonProps}
            type="submit"
            disabled={!form.isValid()}
            loading={createAppointmentMutation.isPending}
          >
            Create
          </Button>
          <DrawerMarkdown content={form.getValues().content} />
        </Stack>
      </form>
    </Drawer>
  );
};

export default CreateAppointmentDrawer;
