import DrawerMarkdown from "../DrawerMarkdown";

import { useUpdateAppointment } from "@/api/gen";
import { Appointment } from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  drawerProps,
  inputProps,
  primaryButtonProps,
  textareaProps,
} from "@/styles/common";
import { fromUtcDate, modifiedValues, toUtcDate } from "@/utils/form";

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
import { useForm } from "@mantine/form";

export type AppointmentFormValues = {
  title: string;
  description: string;
  content: string;
  start: string;
  end: string;
  setEnd: boolean;
};

// The backend clears the end when it receives the Unix epoch.
const CLEARED_END = "1970-01-01T00:00:00";

// In the format the inputs emit, so that untouched fields aren't modified.
const toFormValues = (appointment: Appointment): AppointmentFormValues => ({
  title: appointment.title,
  description: appointment.description ?? "",
  content: appointment.content ?? "",
  start: fromUtcDate(appointment.start),
  end: fromUtcDate(appointment.end ?? appointment.start),
  setEnd: !!appointment.end,
});

type UpdateAppointmentDrawerProps = {
  appointment: Appointment;
  opened: boolean;
  onClose: () => void;
  refetch?: () => void;
};

const UpdateAppointmentDrawer = ({
  appointment,
  opened,
  onClose,
  refetch,
}: UpdateAppointmentDrawerProps) => {
  const form = useForm<AppointmentFormValues>({
    mode: "controlled",
    validateInputOnChange: true,
    transformValues: (values) => ({
      ...values,
      start: toUtcDate(values.start),
      end: toUtcDate(values.end),
    }),
  });

  const updateAppointmentMutation = useUpdateAppointment();

  const confirmClose = useUnsavedChanges(form.isDirty());

  useEffect(() => {
    form.setInitialValues(toFormValues(appointment));
    form.reset();
  }, [form.setInitialValues, form.reset, appointment, opened]);

  const handleSubmit = async (values: AppointmentFormValues) => {
    const { setEnd, ...data } = modifiedValues(form, values);
    if (setEnd !== undefined) {
      // Turning the end on sends its default, which isn't modified itself.
      data.end = setEnd ? values.end : CLEARED_END;
    } else if (!values.setEnd) {
      delete data.end;
    }

    await updateAppointmentMutation.mutateAsync({
      appointmentId: appointment.id,
      data,
    });
    refetch?.();
    form.reset();
    onClose();
  };

  return (
    <Drawer
      {...drawerProps}
      opened={opened}
      onClose={() => confirmClose() && onClose()}
      title="Update Appointment"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            {...inputProps}
            {...form.getInputProps("title")}
            label="Title"
            placeholder="Opening Ceremony"
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
            loading={updateAppointmentMutation.isPending}
          >
            Update
          </Button>
          <DrawerMarkdown content={form.getValues().content} />
        </Stack>
      </form>
    </Drawer>
  );
};

export default UpdateAppointmentDrawer;
