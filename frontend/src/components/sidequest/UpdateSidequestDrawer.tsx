import DrawerMarkdown from "../DrawerMarkdown";

import { useUpdateSidequest } from "@/api/gen";
import { Sidequest, SidequestForUpdate } from "@/api/gen/schemas";
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
  Checkbox,
  Drawer,
  Stack,
  TextInput,
  Textarea,
} from "@mantine/core";

import { useForm } from "@mantine/form";

type UpdateSidequestDrawerProps = {
  sidequest: Sidequest;
  opened: boolean;
  onClose: () => void;
  onUpdated?: (sidequest: Sidequest) => void;
};

const UpdateSidequestDrawer = ({
  sidequest,
  opened,
  onClose,
  onUpdated,
}: UpdateSidequestDrawerProps) => {
  const form = useForm<SidequestForUpdate>({
    mode: "controlled",
    validateInputOnChange: true,
  });

  const updateSidequestMutation = useUpdateSidequest();

  const confirmClose = useUnsavedChanges(form.isDirty());

  useEffect(() => {
    form.setInitialValues({
      name: sidequest.name,
      description: sidequest.description,
      is_higher_result_better: sidequest.is_higher_result_better,
    });

    form.reset();
  }, [form.setInitialValues, form.reset, sidequest, opened]);

  const handleSubmit = async (values: SidequestForUpdate) => {
    const updatedSidequest = await updateSidequestMutation.mutateAsync({
      sidequestId: sidequest.id,
      data: modifiedValues(form, values),
    });

    onUpdated?.(updatedSidequest);
    onClose();
  };

  return (
    <Drawer
      {...drawerProps}
      opened={opened}
      onClose={() => confirmClose() && onClose()}
      title="Update Sidequest"
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
            loading={updateSidequestMutation.isPending}
          >
            Update
          </Button>
          <DrawerMarkdown content={form.getValues().description} />
        </Stack>
      </form>
    </Drawer>
  );
};

export default UpdateSidequestDrawer;
