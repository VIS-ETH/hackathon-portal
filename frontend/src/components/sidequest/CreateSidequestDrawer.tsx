import DrawerMarkdown from "../DrawerMarkdown";

import { useCreateSidequest } from "@/api/gen";
import { SidequestForCreate } from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  drawerProps,
  inputProps,
  primaryButtonProps,
  textareaProps,
} from "@/styles/common";

import { useEffect } from "react";

import {
  Button,
  Checkbox,
  Drawer,
  Stack,
  TextInput,
  Textarea,
} from "@mantine/core";

import { useForm } from "@mantine/form";

type CreateSidequestDrawerProps = {
  eventId: string;
  opened: boolean;
  onClose: () => void;
  refetch?: () => void;
};

const CreateSidequestDrawer = ({
  eventId,
  opened,
  onClose,
  refetch,
}: CreateSidequestDrawerProps) => {
  const form = useForm<SidequestForCreate>({
    mode: "controlled",
    initialValues: {
      event_id: eventId,
      name: "",
      description: "",
      is_higher_result_better: false,
    },
    validateInputOnChange: true,
  });

  const createSidequestMutation = useCreateSidequest();

  const confirmClose = useUnsavedChanges(form.isDirty());

  useEffect(() => {
    form.reset();
  }, [form.setInitialValues, form.reset, opened]);

  const handleSubmit = async (data: SidequestForCreate) => {
    await createSidequestMutation.mutateAsync({
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
      title="Create Sidequest"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            {...inputProps}
            {...form.getInputProps("name")}
            key={form.key("name")}
            label="Name"
            required
          />
          <Textarea
            {...textareaProps}
            {...form.getInputProps("description")}
            key={form.key("description")}
            label="Description"
            description="Supports Markdown"
            required
          />
          <Checkbox
            {...form.getInputProps("is_higher_result_better", {
              type: "checkbox",
            })}
            key={form.key("is_higher_result_better")}
            label="Is higher result better?"
          />
          <Button
            {...primaryButtonProps}
            type="submit"
            disabled={!form.isValid()}
            loading={createSidequestMutation.isPending}
          >
            Create
          </Button>
          <DrawerMarkdown content={form.getValues().description} />
        </Stack>
      </form>
    </Drawer>
  );
};

export default CreateSidequestDrawer;
