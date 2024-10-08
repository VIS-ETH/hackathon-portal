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
      startDate: Date;
      endDate?: Date;
      setEnd: boolean;
    }
  >({
    mode: "controlled",
    validateInputOnChange: true,
    transformValues: (values) =>
      produce(values, (draft) => {
        draft.start = draft.startDate?.toISOString().replace("Z", "");

        if (draft.setEnd) {
          draft.end = draft.endDate?.toISOString().replace("Z", "");
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
      startDate: new Date(`${appointment.start}Z`),
      endDate: new Date(`${appointment.end ?? appointment.start}Z`),
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
            {...form.getInputProps("startDate")}
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
              {...form.getInputProps("endDate")}
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
