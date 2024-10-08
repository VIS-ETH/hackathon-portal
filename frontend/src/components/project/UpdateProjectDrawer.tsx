import MarkdownCard from "../MarkdownCard";

import { useUpdateProject } from "@/api/gen";
import { Project, ProjectForUpdate } from "@/api/gen/schemas";
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

type UpdateProjectDrawerProps = {
  project: Project;
  opened: boolean;
  onClose: () => void;
  refetch?: () => void;
};

const UpdateProjectDrawer = ({
  project,
  opened,
  onClose,
  refetch,
}: UpdateProjectDrawerProps) => {
  const form = useForm<ProjectForUpdate>({
    mode: "controlled",
    validateInputOnChange: true,
    transformValues: (values) =>
      produce(values, (draft) => {
        if (draft.name === project.name) {
          delete draft.name;
        }

        if (draft.content === project.content) {
          delete draft.content;
        }

        return draft;
      }),
  });

  const updateProjectMutation = useUpdateProject();

  useEffect(() => {
    form.setInitialValues({
      name: project.name,
      content: project.content,
    });

    form.reset();
  }, [form.setInitialValues, form.reset, project, opened]);

  const handleSubmit = async (data: ProjectForUpdate) => {
    await updateProjectMutation.mutateAsync({
      projectId: project.id,
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
      title="Update Project"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            {...(inputProps as TextInputProps)}
            {...form.getInputProps("name")}
            label="Name"
            required
            placeholder={project.name}
          />
          <Textarea
            {...(textareaProps as TextareaProps)}
            {...form.getInputProps("content")}
            label="Content"
            description="Supports Markdown"
            placeholder={project.content}
            required
          />
          <Button
            {...primaryButtonProps}
            type="submit"
            disabled={!form.isValid()}
          >
            Update
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

export default UpdateProjectDrawer;
