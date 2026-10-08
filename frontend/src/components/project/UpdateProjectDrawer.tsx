import DrawerMarkdown from "../DrawerMarkdown";

import { getProject, useGetEventAffiliates, useUpdateProject } from "@/api/gen";
import { EventRole, Project, ProjectForUpdate } from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  drawerProps,
  inputProps,
  primaryButtonProps,
  textareaProps,
} from "@/styles/common";
import { modifiedValues } from "@/utils/form";

import { useEffect } from "react";

import {
  Button,
  Drawer,
  MultiSelect,
  Stack,
  TextInput,
  Textarea,
} from "@mantine/core";

import { useForm } from "@mantine/form";

type UpdateProjectDrawerProps = {
  project: Project;
  opened: boolean;
  onClose: () => void;
  onUpdated?: (project: Project) => void;
};

const UpdateProjectDrawer = ({
  project,
  opened,
  onClose,
  onUpdated,
}: UpdateProjectDrawerProps) => {
  const form = useForm<ProjectForUpdate>({
    mode: "controlled",
    validateInputOnChange: true,
  });

  const { data: stakeholder } = useGetEventAffiliates(
    project.event_id,
    { role: EventRole.Stakeholder },
    { query: { enabled: opened } },
  );

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

  const handleSubmit = async (values: ProjectForUpdate) => {
    await updateProjectMutation.mutateAsync({
      projectId: project.id,
      data: modifiedValues(form, values),
    });

    // The update's response type is wrong in the API spec, so fetch the project.
    onUpdated?.(await getProject(project.id));
    onClose();
  };

  return (
    <Drawer
      {...drawerProps}
      opened={opened}
      onClose={() => confirmClose() && onClose()}
      title="Update Project"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            {...inputProps}
            {...form.getInputProps("name")}
            label="Name"
            required
          />
          <MultiSelect
            {...inputProps}
            {...form.getInputProps("stakeholder_ids")}
            label="Stakeholders"
            data={
              stakeholder?.map((s) => ({ value: s.id, label: s.name })) || []
            }
          />
          <Textarea
            {...textareaProps}
            {...form.getInputProps("content")}
            label="Content"
            description="Supports Markdown"
            required
          />
          <Button
            {...primaryButtonProps}
            type="submit"
            disabled={!form.isValid()}
            loading={updateProjectMutation.isPending}
          >
            Update
          </Button>
          <DrawerMarkdown content={form.getValues().content} />
        </Stack>
      </form>
    </Drawer>
  );
};

export default UpdateProjectDrawer;
