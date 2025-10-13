import { useUpdateEvent } from "@/api/gen";
import {
  Event,
  EventForUpdate,
  EventPhase,
  EventVisibility,
} from "@/api/gen/schemas";
import {
  cardHeaderTextProps,
  cardProps,
  inputProps,
  primaryButtonProps,
} from "@/styles/common";

import { useEffect } from "react";

import {
  Anchor,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  NumberInput,
  NumberInputProps,
  Select,
  SelectProps,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  TextInputProps,
  Textarea,
  TextareaProps,
} from "@mantine/core";

import { DateTimePicker, DateTimePickerProps } from "@mantine/dates";
import { useForm } from "@mantine/form";

import { produce } from "immer";
import { stringify } from "yaml";

type EventSettingsProps = {
  event: Event;
  refetch?: () => void;
};

const EventSettings = ({ event, refetch }: EventSettingsProps) => {
  const form = useForm<EventForUpdate>({
    mode: "controlled",
    transformValues: (values) =>
      produce(values, (draft) => {
        // TODO: reconsider the correctness of this approach

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

        if (draft.read_only == event.read_only) {
          delete draft.read_only;
        }

        if (draft.projects_visible == event.projects_visible) {
          delete draft.projects_visible;
        }

        if (
          draft.project_assignments_visible == event.project_assignments_visible
        ) {
          delete draft.project_assignments_visible;
        }

        if (draft.feedback_visible == event.feedback_visible) {
          delete draft.feedback_visible;
        }

        return draft;
      }),
  });

  const updateEventMutation = useUpdateEvent();

  useEffect(() => {
    form.setFieldValue("read_only", event.read_only);
    form.setFieldValue("projects_visible", event.projects_visible);
    form.setFieldValue(
      "project_assignments_visible",
      event.project_assignments_visible,
    );
    form.setFieldValue("finalists_visible", event.finalists_visible);
    form.setFieldValue("vote_enabled", event.vote_enabled);
    form.setFieldValue("feedback_visible", event.feedback_visible);
  }, [form.setValues, event]);

  const handleSubmit = async (data: EventForUpdate) => {
    const dataToPrint = { ...data };
    if (dataToPrint.master_ai_api_key) {
      dataToPrint.master_ai_api_key =
        dataToPrint.master_ai_api_key.slice(0, 6) + "****";
    }

    const confirmation = confirm(
      `WARNING - READ THIS: Are you sure that you want to submit the following patch for ${event.name}?\n\nIf you are not 100% sure of the implications, CANCEL and ASK FOR HELP.\n\n${stringify(dataToPrint)}`,
    );

    if (!confirmation) {
      return;
    }

    await updateEventMutation.mutateAsync({
      eventId: event.id,
      data,
    });

    form.reset();
    refetch?.();
  };

  return (
    <Stack>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <SimpleGrid cols={{ xs: 1, md: 3 }}>
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
            <TextInput
              {...(inputProps as TextInputProps)}
              {...form.getInputProps("master_ai_api_key")}
              key={form.key("master_ai_api_key")}
              label="Master AI API Key"
              type="password"
            />
          </SimpleGrid>
          <Divider label="Infrastructure" labelPosition="left" />
          <SimpleGrid cols={{ xs: 1, md: 3 }}>
            <TextInput
              {...(inputProps as TextInputProps)}
              {...form.getInputProps("managed_address_template")}
              key={form.key("managed_address_template")}
              label="Managed Address Template"
              placeholder={event.managed_address_template || "N/A"}
            />
            <TextInput
              {...(inputProps as TextInputProps)}
              {...form.getInputProps("direct_address_template")}
              key={form.key("direct_address_template")}
              label="Direct Address Template"
              placeholder={event.direct_address_template || "N/A"}
            />
            <TextInput
              {...(inputProps as TextInputProps)}
              {...form.getInputProps("private_address_template")}
              key={form.key("private_address_template")}
              label="Private Address Template"
              placeholder={event.private_address_template || "N/A"}
            />
            <Textarea
              {...(inputProps as TextareaProps)}
              {...form.getInputProps("ssh_config_template")}
              key={form.key("ssh_config_template")}
              label="SSH Config Template"
              placeholder={event.ssh_config_template || "N/A"}
            />
          </SimpleGrid>
          <Divider label="Permissions" labelPosition="left" />
          <SimpleGrid cols={{ xs: 1, md: 3 }}>
            <Checkbox
              {...form.getInputProps("read_only", { type: "checkbox" })}
              key={form.key("read_only")}
              label="Read only"
            />
            <Checkbox
              {...form.getInputProps("projects_visible", { type: "checkbox" })}
              key={form.key("projects_visible")}
              label="Projects visible"
            />
            <Checkbox
              {...form.getInputProps("project_assignments_visible", {
                type: "checkbox",
              })}
              key={form.key("project_assignments_visible")}
              label="Project assignments visible"
            />
            <Checkbox
              {...form.getInputProps("finalists_visible", {
                type: "checkbox",
              })}
              key={form.key("finalists_visible")}
              label="Finalists visible"
            />
            <Checkbox
              {...form.getInputProps("vote_enabled", {
                type: "checkbox",
              })}
              key={form.key("vote_enabled")}
              label="Vote open"
            />
            <Checkbox
              {...form.getInputProps("feedback_visible", {
                type: "checkbox",
              })}
              key={form.key("feedback_visible")}
              label="Feedback visible"
            />
          </SimpleGrid>
          <Group align="end">
            <Button {...primaryButtonProps} type="submit">
              Update
            </Button>
          </Group>
        </Stack>
      </form>
      <Divider />
      <Card {...cardProps}>
        <Group justify="space-between">
          <Text {...cardHeaderTextProps}>Presentations</Text>
          <Group>
            <Anchor
              href={`/events/${event.slug}/admin/presentations/projects`}
              target="_blank"
            >
              Projects
            </Anchor>
            <Anchor
              href={`/events/${event.slug}/admin/presentations/assignments`}
              target="_blank"
            >
              Assignments
            </Anchor>
            <Anchor
              href={`/events/${event.slug}/admin/presentations/ranking?maxTeams=10`}
              target="_blank"
            >
              Ranking
            </Anchor>
            <Anchor
              href={`/events/${event.slug}/admin/presentations/sidequests-dashboard`}
              target="_blank"
            >
              Sidequests Dashboard
            </Anchor>
          </Group>
        </Group>
      </Card>
    </Stack>
  );
};

export default EventSettings;
