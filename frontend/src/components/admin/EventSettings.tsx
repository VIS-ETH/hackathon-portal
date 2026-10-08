import { useUpdateEvent } from "@/api/gen";
import {
  Event,
  EventForUpdate,
  EventPhase,
  EventVisibility,
} from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  cardHeaderTextProps,
  cardProps,
  codeInputProps,
  codeTextareaProps,
  iconProps,
  inputProps,
  primaryButtonProps,
} from "@/styles/common";
import {
  fromUtcDate,
  modifiedFields,
  modifiedValues,
  toUtcDate,
} from "@/utils/form";

import { useEffect } from "react";

import {
  Anchor,
  Badge,
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
  Tooltip,
  UnstyledButton,
} from "@mantine/core";

import { DateTimePicker, DateTimePickerProps } from "@mantine/dates";
import { isInRange, isNotEmpty, useForm } from "@mantine/form";

import { IconArrowBackUp } from "@tabler/icons-react";
import { stringify } from "yaml";

type EventSettingsProps = {
  event: Event;
  refetch?: () => void;
};

type ModifiedBadgeProps = {
  label: string;
  onReset: () => void;
};

// Marks a modified field. It sits inside the field's label, so the click must
// not reach the label.
const ModifiedBadge = ({ label, onReset }: ModifiedBadgeProps) => (
  <Tooltip label="Reset to the saved value">
    <UnstyledButton
      aria-label={`Reset ${label}`}
      display="flex"
      onClick={(event) => {
        event.preventDefault();
        onReset();
      }}
    >
      <Badge
        component="span"
        size="xs"
        color="yellow"
        variant="light"
        rightSection={<IconArrowBackUp {...iconProps} size={10} />}
      >
        Modified
      </Badge>
    </UnstyledButton>
  </Tooltip>
);

const atLeast = (min: number) => isInRange({ min }, `Must be at least ${min}`);

// Initial values in the format the inputs emit, so that untouched fields
// aren't modified.
const toFormValues = (event: Event): EventForUpdate => ({
  name: event.name,
  start: fromUtcDate(event.start),
  end: fromUtcDate(event.end),
  visibility: event.visibility,
  phase: event.phase,
  max_team_size: event.max_team_size,
  sidequest_cooldown: event.sidequest_cooldown,
  max_teams_per_project: event.max_teams_per_project,
  master_ai_api_key: "",
  blog_max_sections: event.blog_max_sections,
  blog_max_images: event.blog_max_images,
  blog_max_characters: event.blog_max_characters,
  blog_max_image_size_mb: event.blog_max_image_size_mb,
  managed_address_template: event.managed_address_template ?? "",
  direct_address_template: event.direct_address_template ?? "",
  private_address_template: event.private_address_template ?? "",
  ssh_config_template: event.ssh_config_template ?? "",
  read_only: event.read_only,
  projects_visible: event.projects_visible,
  project_assignments_visible: event.project_assignments_visible,
  finalists_visible: event.finalists_visible,
  public_vote_open: event.public_vote_open,
  jury_rating_open: event.jury_rating_open,
  feedback_visible: event.feedback_visible,
});

const EventSettings = ({ event, refetch }: EventSettingsProps) => {
  const form = useForm<EventForUpdate>({
    mode: "controlled",
    initialValues: toFormValues(event),
    validateInputOnChange: true,
    validate: {
      name: isNotEmpty("Name must not be empty"),
      max_team_size: atLeast(1),
      sidequest_cooldown: atLeast(0),
      max_teams_per_project: atLeast(0),
      blog_max_sections: atLeast(0),
      blog_max_images: atLeast(0),
      blog_max_characters: atLeast(0),
      blog_max_image_size_mb: atLeast(1),
    },
    transformValues: (values) => ({
      ...values,
      start: values.start && toUtcDate(values.start),
      end: values.end && toUtcDate(values.end),
    }),
  });

  const updateEventMutation = useUpdateEvent();

  useEffect(() => {
    form.setInitialValues(toFormValues(event));
    form.reset();
  }, [form.setInitialValues, form.reset, event]);

  useUnsavedChanges(form.isDirty());

  const modifiedCount = modifiedFields(form).length;

  const modifiedBadge = (label: string, path: keyof EventForUpdate) =>
    form.isDirty(path) && (
      <ModifiedBadge
        label={label}
        // resetField would keep the field dirty
        onReset={() => form.setFieldValue(path, form.getInitialValues()[path])}
      />
    );

  const fieldLabel = (label: string, path: keyof EventForUpdate) => ({
    label: (
      <Group component="span" justify="space-between" wrap="nowrap">
        {label}
        {modifiedBadge(label, path)}
      </Group>
    ),
    labelProps: { w: "100%" },
  });

  const handleSubmit = async (values: EventForUpdate) => {
    const data = modifiedValues(form, values);
    const dataToPrint = { ...data };
    if (dataToPrint.master_ai_api_key) {
      dataToPrint.master_ai_api_key =
        dataToPrint.master_ai_api_key.slice(0, 6) + "****";
    }

    const confirmation = confirm(
      `Warning: are you sure that you want to submit the following changes to ${event.name}?\n\nIf you are not completely sure of the implications, cancel and ask for help.\n\n${stringify(dataToPrint)}`,
    );

    if (!confirmation) {
      return;
    }

    const updatedEvent = await updateEventMutation.mutateAsync({
      eventId: event.id,
      data,
    });

    form.setInitialValues(toFormValues(updatedEvent));
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
              {...fieldLabel("Name", "name")}
            />
            <DateTimePicker
              {...(inputProps as DateTimePickerProps)}
              {...form.getInputProps("start")}
              key={form.key("start")}
              {...fieldLabel("Start", "start")}
            />
            <DateTimePicker
              {...(inputProps as DateTimePickerProps)}
              {...form.getInputProps("end")}
              key={form.key("end")}
              {...fieldLabel("End", "end")}
            />
            <Select
              {...(inputProps as SelectProps)}
              {...form.getInputProps("visibility")}
              key={form.key("visibility")}
              data={Object.values(EventVisibility)}
              {...fieldLabel("Visibility", "visibility")}
            />
            <Select
              {...(inputProps as SelectProps)}
              {...form.getInputProps("phase")}
              key={form.key("phase")}
              data={Object.values(EventPhase)}
              {...fieldLabel("Phase", "phase")}
            />
            <NumberInput
              {...(inputProps as NumberInputProps)}
              {...form.getInputProps("max_team_size")}
              key={form.key("max_team_size")}
              {...fieldLabel("Max team size", "max_team_size")}
              min={1}
              step={1}
            />
            <NumberInput
              {...(inputProps as NumberInputProps)}
              {...form.getInputProps("sidequest_cooldown")}
              key={form.key("sidequest_cooldown")}
              {...fieldLabel(
                "Sidequest cooldown (minutes)",
                "sidequest_cooldown",
              )}
              min={0}
              step={1}
            />
            <NumberInput
              {...(inputProps as NumberInputProps)}
              {...form.getInputProps("max_teams_per_project")}
              key={form.key("max_teams_per_project")}
              {...fieldLabel("Max teams per project", "max_teams_per_project")}
              min={0}
              step={1}
            />
            <TextInput
              {...(inputProps as TextInputProps)}
              {...form.getInputProps("master_ai_api_key")}
              key={form.key("master_ai_api_key")}
              {...fieldLabel("Master AI API key", "master_ai_api_key")}
              type="password"
            />
          </SimpleGrid>
          <Divider label="Team Blog" labelPosition="left" />
          <SimpleGrid cols={{ xs: 1, md: 3 }}>
            <NumberInput
              {...(inputProps as NumberInputProps)}
              {...form.getInputProps("blog_max_sections")}
              key={form.key("blog_max_sections")}
              {...fieldLabel("Max sections per blog", "blog_max_sections")}
              min={0}
              step={1}
            />
            <NumberInput
              {...(inputProps as NumberInputProps)}
              {...form.getInputProps("blog_max_images")}
              key={form.key("blog_max_images")}
              {...fieldLabel("Max images per blog", "blog_max_images")}
              min={0}
              step={1}
            />
            <NumberInput
              {...(inputProps as NumberInputProps)}
              {...form.getInputProps("blog_max_characters")}
              key={form.key("blog_max_characters")}
              {...fieldLabel("Max characters per blog", "blog_max_characters")}
              min={0}
              step={1}
            />
            <NumberInput
              {...(inputProps as NumberInputProps)}
              {...form.getInputProps("blog_max_image_size_mb")}
              key={form.key("blog_max_image_size_mb")}
              {...fieldLabel(
                "Max blog image size (MB)",
                "blog_max_image_size_mb",
              )}
              min={1}
              step={1}
            />
          </SimpleGrid>
          <Divider label="Infrastructure" labelPosition="left" />
          <SimpleGrid cols={{ xs: 1, md: 3 }}>
            <TextInput
              {...(codeInputProps as TextInputProps)}
              {...form.getInputProps("managed_address_template")}
              key={form.key("managed_address_template")}
              {...fieldLabel(
                "Managed address template",
                "managed_address_template",
              )}
            />
            <TextInput
              {...(codeInputProps as TextInputProps)}
              {...form.getInputProps("direct_address_template")}
              key={form.key("direct_address_template")}
              {...fieldLabel(
                "Direct address template",
                "direct_address_template",
              )}
            />
            <TextInput
              {...(codeInputProps as TextInputProps)}
              {...form.getInputProps("private_address_template")}
              key={form.key("private_address_template")}
              {...fieldLabel(
                "Private address template",
                "private_address_template",
              )}
            />
            <Textarea
              {...(codeTextareaProps as TextareaProps)}
              {...form.getInputProps("ssh_config_template")}
              key={form.key("ssh_config_template")}
              {...fieldLabel("SSH config template", "ssh_config_template")}
              minRows={3}
              wrap="off"
            />
          </SimpleGrid>
          <Divider label="Permissions" labelPosition="left" />
          <SimpleGrid cols={{ xs: 1, md: 3 }}>
            <Group justify="space-between" wrap="nowrap">
              <Checkbox
                {...form.getInputProps("read_only", { type: "checkbox" })}
                key={form.key("read_only")}
                label="Read only"
              />
              {modifiedBadge("Read only", "read_only")}
            </Group>
            <Group justify="space-between" wrap="nowrap">
              <Checkbox
                {...form.getInputProps("projects_visible", {
                  type: "checkbox",
                })}
                key={form.key("projects_visible")}
                label="Projects visible"
              />
              {modifiedBadge("Projects visible", "projects_visible")}
            </Group>
            <Group justify="space-between" wrap="nowrap">
              <Checkbox
                {...form.getInputProps("project_assignments_visible", {
                  type: "checkbox",
                })}
                key={form.key("project_assignments_visible")}
                label="Project assignments visible"
              />
              {modifiedBadge(
                "Project assignments visible",
                "project_assignments_visible",
              )}
            </Group>
            <Group justify="space-between" wrap="nowrap">
              <Checkbox
                {...form.getInputProps("finalists_visible", {
                  type: "checkbox",
                })}
                key={form.key("finalists_visible")}
                label="Finalists visible"
              />
              {modifiedBadge("Finalists visible", "finalists_visible")}
            </Group>
            <Group justify="space-between" wrap="nowrap">
              <Checkbox
                {...form.getInputProps("public_vote_open", {
                  type: "checkbox",
                })}
                key={form.key("public_vote_open")}
                label="Public vote open"
              />
              {modifiedBadge("Public vote open", "public_vote_open")}
            </Group>
            <Group justify="space-between" wrap="nowrap">
              <Checkbox
                {...form.getInputProps("jury_rating_open", {
                  type: "checkbox",
                })}
                key={form.key("jury_rating_open")}
                label="Jury rating open"
              />
              {modifiedBadge("Jury rating open", "jury_rating_open")}
            </Group>
            <Group justify="space-between" wrap="nowrap">
              <Checkbox
                {...form.getInputProps("feedback_visible", {
                  type: "checkbox",
                })}
                key={form.key("feedback_visible")}
                label="Feedback visible"
              />
              {modifiedBadge("Feedback visible", "feedback_visible")}
            </Group>
          </SimpleGrid>
          <Group justify="flex-end" gap="xs">
            <Text c="dimmed" size="sm">
              {modifiedCount === 0
                ? "No changes"
                : `${modifiedCount} ${modifiedCount === 1 ? "field" : "fields"} modified`}
            </Text>
            <Group gap="xs" wrap="nowrap">
              <Button
                {...primaryButtonProps}
                variant="default"
                disabled={modifiedCount === 0}
                onClick={form.reset}
              >
                Discard Changes
              </Button>
              <Button
                {...primaryButtonProps}
                type="submit"
                disabled={modifiedCount === 0}
                loading={updateEventMutation.isPending}
              >
                Update
              </Button>
            </Group>
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
