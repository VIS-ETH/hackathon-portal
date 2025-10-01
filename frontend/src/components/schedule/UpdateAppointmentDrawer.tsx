import { useUpdateAppointment } from "@/api/gen";
import { Appointment, AppointmentForUpdate } from "@/api/gen/schemas";
import { inputProps, primaryButtonProps, textareaProps } from "@/styles/common";

import { useEffect } from "react";

import {
  Button,
  Checkbox,
  Drawer,
  Stack,
  TextInput,
  TextInputProps,
  Textarea,
  TextareaProps,
} from "@mantine/core";

import { DateTimePicker, DateTimePickerProps } from "@mantine/dates";
import { useForm } from "@mantine/form";

import { produce } from "immer";

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
  const form = useForm<
    AppointmentForUpdate & {
      setEnd: boolean;
    }
  >({
    mode: "controlled",
    validateInputOnChange: true,
    transformValues: (values) =>
      produce(values, (draft) => {
        draft.title = values.title;
        if (values.start) {
          // should always be true
          draft.start = new Date(values.start).toISOString().replace("Z", "");
        }
        if (values.end) {
          draft.end = new Date(values.end).toISOString().replace("Z", "");
        } else {
          draft.end = null;
        }
        return draft;
      }),
  });

  const updateAppointmentMutation = useUpdateAppointment();

  useEffect(() => {
    form.setInitialValues({
      title: appointment.title,
      description: appointment.description,
      content: appointment.content,
      start: `${appointment.start}Z`,
      end: `${appointment.end ?? appointment.start}Z`,
      setEnd: !!appointment.end,
    });

    form.reset();
  }, [form.setInitialValues, form.reset, appointment, opened]);

  const handleSubmit = async (data: AppointmentForUpdate) => {
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
      position="right"
      opened={opened}
      onClose={onClose}
      title="Create Appointment"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            {...(inputProps as TextInputProps)}
            {...form.getInputProps("title")}
            label="Title"
            placeholder={appointment.title}
          />
          <TextInput
            {...(inputProps as TextInputProps)}
            {...form.getInputProps("description")}
            label="Description"
            placeholder={appointment.description ?? ""}
          />
          <Textarea
            {...(textareaProps as TextareaProps)}
            {...form.getInputProps("content")}
            label="Content"
            description="Supports Markdown"
            placeholder={appointment.content ?? ""}
          />
          <DateTimePicker
            {...(inputProps as DateTimePickerProps)}
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
              {...(inputProps as DateTimePickerProps)}
              {...form.getInputProps("end")}
              label="End"
            />
          )}
          <Button
            {...primaryButtonProps}
            type="submit"
            disabled={!form.isValid()}
          >
            Update
          </Button>
        </Stack>
      </form>
    </Drawer>
  );
};

export default UpdateAppointmentDrawer;
