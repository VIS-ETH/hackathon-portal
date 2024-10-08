import { useCreateAppointment } from "@/api/gen";
import { AppointmentForCreate } from "@/api/gen/schemas";
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
    AppointmentForCreate & {
      startDate: Date;
      endDate?: Date;
      setEnd: boolean;
    }
  >({
    mode: "controlled",
    validateInputOnChange: true,
    transformValues: (values) =>
      produce(values, (draft) => {
        draft.event_id = eventId;

        draft.start = draft.startDate.toISOString().replace("Z", "");

        if (draft.setEnd) {
          draft.end = draft.endDate?.toISOString().replace("Z", "");
        }

        return draft;
      }),
  });

  const createAppointmentMutation = useCreateAppointment();

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
            placeholder="Opening Ceremony"
            required
          />
          <TextInput
            {...(inputProps as TextInputProps)}
            {...form.getInputProps("description")}
            label="Description"
            placeholder="Audimax (HG F30)"
          />
          <Textarea
            {...(textareaProps as TextareaProps)}
            {...form.getInputProps("content")}
            label="Content"
            description="Supports Markdown"
          />
          <DateTimePicker
            {...(inputProps as DateTimePickerProps)}
            {...form.getInputProps("startDate")}
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
            Create
          </Button>
        </Stack>
      </form>
    </Drawer>
  );
};

export default CreateAppointmentDrawer;
