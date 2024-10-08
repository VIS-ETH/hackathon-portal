import MarkdownCard from "../MarkdownCard";

import { useCreateProject } from "@/api/gen";
import { ProjectForCreate } from "@/api/gen/schemas";
import { inputProps, primaryButtonProps, textareaProps } from "@/styles/common";

import { useEffect } from "react";

import {
  Button,
  Divider,
  Drawer,
  Stack,
  TextInput,
  TextInputProps,
  Textarea,
  TextareaProps,
} from "@mantine/core";

import { useForm } from "@mantine/form";

import { produce } from "immer";

type CreateProjectDrawerProps = {
  eventId: string;
  opened: boolean;
  onClose: () => void;
  refetch?: () => void;
};

const CreateProjectDrawer = ({
  eventId,
  opened,
  onClose,
  refetch,
}: CreateProjectDrawerProps) => {
  const form = useForm<ProjectForCreate>({
    mode: "controlled",
    validateInputOnChange: true,
    transformValues: (values) =>
      produce(values, (draft) => {
        draft.event_id = eventId;
        return draft;
      }),
  });

  const createProjectMutation = useCreateProject();

  useEffect(() => {
    form.reset();
  }, [form.setInitialValues, form.reset, opened]);

  const handleSubmit = async (data: ProjectForCreate) => {
    await createProjectMutation.mutateAsync({
      data,
    });

    refetch?.();
    onClose();
  };

  return (
    <Drawer
      position="right"
      size="xl"
      opened={opened}
      onClose={onClose}
      title="Create Project"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            {...(inputProps as TextInputProps)}
            {...form.getInputProps("name")}
            label="Name"
            required
          />
          <Textarea
            {...(textareaProps as TextareaProps)}
            {...form.getInputProps("content")}
            label="Content"
            description="Supports Markdown"
            required
          />
          <Button
            {...primaryButtonProps}
            type="submit"
            disabled={!form.isValid()}
          >
            Create
          </Button>
          <Divider />
          <MarkdownCard
            content={form.getValues().content || "Nothing to preview"}
          />
        </Stack>
      </form>
    </Drawer>
  );
};

export default CreateProjectDrawer;
