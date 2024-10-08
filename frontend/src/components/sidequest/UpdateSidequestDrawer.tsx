import MarkdownCard from "../MarkdownCard";

import { useUpdateSidequest } from "@/api/gen";
import { Sidequest, SidequestForUpdate } from "@/api/gen/schemas";
import { inputProps, primaryButtonProps, textareaProps } from "@/styles/common";

import { useEffect } from "react";

import {
  Button,
  Checkbox,
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

type UpdateSidequestDrawerProps = {
  sidequest: Sidequest;
  opened: boolean;
  onClose: () => void;
  refetch?: () => void;
};

const UpdateSidequestDrawer = ({
  sidequest,
  opened,
  onClose,
  refetch,
}: UpdateSidequestDrawerProps) => {
  const form = useForm<SidequestForUpdate>({
    mode: "controlled",
    validateInputOnChange: true,
    transformValues: (values) =>
      produce(values, (draft) => {
        if (draft.name === sidequest.name) {
          delete draft.name;
        }

        if (draft.description === sidequest.description) {
          delete draft.description;
        }

        return draft;
      }),
  });

  const updateSidequestMutation = useUpdateSidequest();

  useEffect(() => {
    form.setInitialValues({
      name: sidequest.name,
      description: sidequest.description,
      is_higher_result_better: sidequest.is_higher_result_better,
    });

    form.reset();
  }, [form.setInitialValues, form.reset, sidequest, opened]);

  const handleSubmit = async (data: SidequestForUpdate) => {
    await updateSidequestMutation.mutateAsync({
      sidequestId: sidequest.id,
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
      title="Update Sidequest"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            {...(inputProps as TextInputProps)}
            {...form.getInputProps("name")}
            key={form.key("name")}
            label="Name"
            required
            placeholder={sidequest.name}
          />
          <Textarea
            {...(textareaProps as TextareaProps)}
            {...form.getInputProps("description")}
            key={form.key("description")}
            label="Description"
            description="Supports Markdown"
            placeholder={sidequest.description}
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
          >
            Update
          </Button>
          <Divider />
          <MarkdownCard
            content={form.getValues().description || "Nothing to preview"}
          />
        </Stack>
      </form>
    </Drawer>
  );
};

export default UpdateSidequestDrawer;
