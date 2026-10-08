import DrawerMarkdown from "../DrawerMarkdown";

import { useCreateProject } from "@/api/gen";
import { ProjectForCreate } from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  drawerProps,
  inputProps,
  primaryButtonProps,
  textareaProps,
} from "@/styles/common";

import { useEffect } from "react";

import { Button, Drawer, Stack, TextInput, Textarea } from "@mantine/core";

import { useForm } from "@mantine/form";

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
    initialValues: { event_id: eventId, name: "", content: "" },
    validateInputOnChange: true,
  });

  const createProjectMutation = useCreateProject();

  const confirmClose = useUnsavedChanges(form.isDirty());

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
      {...drawerProps}
      opened={opened}
      onClose={() => confirmClose() && onClose()}
      title="Create Project"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            {...inputProps}
            {...form.getInputProps("name")}
            label="Name"
            required
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
            loading={createProjectMutation.isPending}
          >
            Create
          </Button>
          <DrawerMarkdown content={form.getValues().content} />
        </Stack>
      </form>
    </Drawer>
  );
};

export default CreateProjectDrawer;
