"use client";

import {
  EventDto,
  PatchEventMutationRequest,
  eventPhase,
  usePatchEvent,
} from "@/api/gen";

import { useEffect } from "react";

import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  NumberInput,
  NumberInputProps,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";

import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";

import { IconDeviceFloppy, IconSend, IconTrash } from "@tabler/icons-react";
import { produce } from "immer";

type EventFormProps = {
  event: EventDto;
  //   worker: Worker;
  //   onClose: () => void;
  //   reset?: any;
};

const EventForm = ({ event }: EventFormProps) => {
  const form = useForm<PatchEventMutationRequest>({
    mode: "controlled",
    transformValues: (values) =>
      produce(values, (draft) => {
        if ((draft.end as any) === "") {
          draft.end = null;
        }
        if ((draft.is_feedback_visible as any) === "") {
          draft.is_feedback_visible = null;
        }
        if ((draft.max_team_size as any) === "") {
          draft.max_team_size = null;
        }
        if ((draft.name as any) === "") {
          draft.name = null;
        }
        if ((draft.phase as any) === "") {
          draft.phase = null;
        }

        if ((draft.start as any) === "") {
          draft.start = null;
        }

        if ((draft.visibility as any) === "") {
          draft.visibility = null;
        }



        return draft;
      }),
  });

  const updateWorkerMutation = usePatchEvent(event.id);

  //   useEffect(() => {
  //     form.reset();
  //   }, [poi, worker, reset]);

  const updateWorker = async (payload: PatchEventMutationRequest) => {
    await updateWorkerMutation.mutateAsync(payload);
    // onClose();
  };

  return (
    <form onSubmit={form.onSubmit(updateWorker)}>
      <Stack gap={"sm"}>
        <Flex justify={"space-between"}>
          <Title order={3}>Event Settings</Title>
          <ActionIcon type="submit">
            <IconDeviceFloppy />
          </ActionIcon>
        </Flex>
        <Group grow>
          <TextInput
            {...form.getInputProps("name")}
            key={form.key("name")}
            placeholder={event.name}
            //   checked={form.getValues().name.length < 2 }
            label="Name"
          />
          <DateTimePicker
            {...form.getInputProps("start")}
            key={form.key("start")}
            placeholder={event.start}
            label="Start"
            //   placeholder={worker?.n_tickets.toString()}
          />
          <DateTimePicker
            {...form.getInputProps("end")}
            key={form.key("end")}
            label="End"
            placeholder={event.end}
          />
        </Group>
        <Group grow>
          <NumberInput
            {...form.getInputProps("max_team_size")}
            key={form.key("max_team_size")}
            label="Max team size"
            placeholder={event.max_team_size.toString()}
            min={1}
            step={1}
          />

          <NumberInput
            {...form.getInputProps("cooldown")}
            key={form.key("cooldown")}
            label="Cooldown in minutes"
            // placeholder={event.cooldown.toString()}
            min={1}
            step={1}
          />
          <Box></Box>
        </Group>
        {/* Cooldown */}

        <Group grow>
          <Select
            {...form.getInputProps("visibility")}
            key={form.key("visibility")}
            label="Visible"
          />

          <Select
            {...form.getInputProps("phase")}
            key={form.key("phase")}
            placeholder={event.phase}
            data={[
              eventPhase.Registration,
              eventPhase.Hacking,
              eventPhase.Grading,
              eventPhase.Finished,
            ]}
            label="Phase"
          />
          <Stack>
            <Switch
              {...form.getInputProps("read_only")}
              key={form.key("read_only")}
              label="Read Only"
            />

            <Switch
              {...form.getInputProps("is_feedback_visible")}
              key={form.key("is_feedback_visible")}
              label="Feedback Visible"
            />
          </Stack>
        </Group>

{/* TODO */}
        <Textarea label="Welcome Page" autosize minRows={8} {...form.getInputProps("welcome_page")}/>
        <Textarea label="Documentation" autosize minRows={8} {...form.getInputProps("welcome_page")}/>
       
      </Stack>
    </form>
  );
};

export default EventForm;
