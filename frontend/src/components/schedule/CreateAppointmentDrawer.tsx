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
      setEnd: boolean;
    }
  >({
    mode: "controlled",
    validateInputOnChange: true,
    transformValues: (values) =>
      produce(values, (draft) => {
        draft.title = values.title;
        draft.event_id = eventId;
        console.log("type of start", typeof values.start);
        draft.start = new Date(values.start).toISOString().replace("Z", "");
        if (values.end) {
          draft.end = new Date(values.end).toISOString().replace("Z", "");
        } else {
          draft.end = null;
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
            {...form.getInputProps("start")}
            label="Start"
            required
          />
          {/* {typeof (form.getValues().startDate)} */}
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
            Create
          </Button>
        </Stack>
      </form>
    </Drawer>
  );
};

export default CreateAppointmentDrawer;
