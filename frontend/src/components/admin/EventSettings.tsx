import { useUpdateEvent } from "@/api/gen";
import {
  Event,
  EventForUpdate,
  EventPhase,
  EventVisibility,
} from "@/api/gen/schemas";
import { inputProps, primaryButtonProps } from "@/styles/common";

import { useEffect } from "react";

import {
  Button,
  Checkbox,
  Group,
  NumberInput,
  NumberInputProps,
  Select,
  SelectProps,
  SimpleGrid,
  Stack,
  TextInput,
  TextInputProps,
} from "@mantine/core";

import { DateTimePicker, DateTimePickerProps } from "@mantine/dates";
import { useForm } from "@mantine/form";

import { produce } from "immer";

type EventSettingsProps = {
  event: Event;
  refetch?: () => void;
};

const EventSettings = ({ event, refetch }: EventSettingsProps) => {
  const form = useForm<EventForUpdate>({
    mode: "controlled",
    transformValues: (values) =>
      produce(values, (draft) => {
        if (!draft.name) {
          delete draft.name;
        }

        if (!draft.start) {
          delete draft.start;
        }

        if (!draft.end) {
          delete draft.end;
        }

        if (!draft.visibility) {
          delete draft.visibility;
        }

        if (!draft.phase) {
          delete draft.phase;
        }

        if (!draft.max_team_size && draft.max_team_size !== 0) {
          delete draft.max_team_size;
        }

        if (!draft.max_teams_per_project && draft.max_teams_per_project !== 0) {
          delete draft.max_teams_per_project;
        }

        if (!draft.sidequest_cooldown && draft.sidequest_cooldown !== 0) {
          delete draft.sidequest_cooldown;
        }

        return draft;
      }),
  });

  const updateEventMutation = useUpdateEvent();

  useEffect(() => {
    form.setFieldValue("is_read_only", event.is_read_only);
    form.setFieldValue("is_feedback_visible", event.is_feedback_visible);
  }, [form.setValues, event]);

  const handleSubmit = async (data: EventForUpdate) => {
    await updateEventMutation.mutateAsync({
      eventId: event.id,
      data,
    });

    form.reset();
    refetch?.();
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <SimpleGrid mb="xl" cols={{ xs: 1, md: 3 }}>
        <TextInput
          {...(inputProps as TextInputProps)}
          {...form.getInputProps("name")}
          key={form.key("name")}
          label="Name"
          placeholder={event.name}
        />
        <DateTimePicker
          {...(inputProps as DateTimePickerProps)}
          {...form.getInputProps("start")}
          key={form.key("start")}
          label="Start"
          placeholder={event.start + " UTC"}
        />
        <DateTimePicker
          {...(inputProps as DateTimePickerProps)}
          {...form.getInputProps("end")}
          key={form.key("end")}
          label="End"
          placeholder={event.end + " UTC"}
        />
        <Select
          {...(inputProps as SelectProps)}
          {...form.getInputProps("visibility")}
          key={form.key("visibility")}
          data={Object.values(EventVisibility)}
          label="Visibility"
          placeholder={event.visibility}
          clearable
        />
        <Select
          {...(inputProps as SelectProps)}
          {...form.getInputProps("phase")}
          key={form.key("phase")}
          data={Object.values(EventPhase)}
          label="Phase"
          placeholder={event.phase}
          clearable
        />
        <Stack justify="flex-end" gap={2}>
          <Checkbox
            {...form.getInputProps("is_read_only", { type: "checkbox" })}
            key={form.key("is_read_only")}
            label="Read only"
          />
          <Checkbox
            {...form.getInputProps("is_feedback_visible", { type: "checkbox" })}
            key={form.key("is_feedback_visible")}
            label="Feedback visible"
          />
        </Stack>
        <NumberInput
          {...(inputProps as NumberInputProps)}
          {...form.getInputProps("max_team_size")}
          key={form.key("max_team_size")}
          label="Max team size"
          placeholder={event.max_team_size.toString()}
          min={1}
          step={1}
        />
        <NumberInput
          {...(inputProps as NumberInputProps)}
          {...form.getInputProps("sidequest_cooldown")}
          key={form.key("sidequest_cooldown")}
          label="Sidequest cooldown (minutes)"
          placeholder={event.sidequest_cooldown.toString()}
          min={0}
          step={1}
        />
        <NumberInput
          {...(inputProps as NumberInputProps)}
          {...form.getInputProps("max_teams_per_project")}
          key={form.key("max_teams_per_project")}
          label="Max team per project"
          placeholder={event.max_teams_per_project.toString()}
          min={0}
          step={1}
        />
        <Group align="end">
          <Button {...primaryButtonProps} type="submit">
            Update
          </Button>
        </Group>
      </SimpleGrid>
    </form>
  );
};

export default EventSettings;
