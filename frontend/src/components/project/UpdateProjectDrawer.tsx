import MarkdownCard from "../MarkdownCard";

import { useGetEventAffiliates, useUpdateProject } from "@/api/gen";
import { EventRole, Project, ProjectForUpdate } from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { inputProps, primaryButtonProps, textareaProps } from "@/styles/common";

import { useEffect } from "react";

import {
  Button,
  Divider,
  Drawer,
  MultiSelect,
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

        if (draft.stakeholder_ids?.length === project.stakeholders?.length) {
          const stakeholderIds = project.stakeholders?.map((s) => s.id) || [];
          const isSame = stakeholderIds.every((id) =>
            draft.stakeholder_ids?.includes(id),
          );

          if (isSame) {
            delete draft.stakeholder_ids;
          }
        }

        return draft;
      }),
  });

  const { data: stakeholder } = useGetEventAffiliates(project.event_id, {
    role: EventRole.Stakeholder,
  });

  const updateProjectMutation = useUpdateProject();

  const confirmClose = useUnsavedChanges(form.isDirty());

  useEffect(() => {
    form.setInitialValues({
      name: project.name,
      content: project.content,
      stakeholder_ids: project.stakeholders?.map((s) => s.id) || [],
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
      onClose={() => confirmClose() && onClose()}
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
          <MultiSelect
            {...form.getInputProps("stakeholder_ids")}
            label="Stakeholders"
            data={
              stakeholder?.map((s) => ({ value: s.id, label: s.name })) || []
            }
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
            trusted
            content={form.getValues().content || "Nothing to preview"}
          />
        </Stack>
      </form>
    </Drawer>
  );
};

export default UpdateProjectDrawer;
