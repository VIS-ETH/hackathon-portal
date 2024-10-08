import MarkdownCard from "../MarkdownCard";

import { useCreateSidequest } from "@/api/gen";
import { SidequestForCreate } from "@/api/gen/schemas";
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
    validateInputOnChange: true,
    transformValues: (values) =>
      produce(values, (draft) => {
        draft.event_id = eventId;
        draft.is_higher_result_better = !!draft.is_higher_result_better;
        return draft;
      }),
  });

  const createSidequestMutation = useCreateSidequest();

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
      position="right"
      size="xl"
      opened={opened}
      onClose={onClose}
      title="Create Sidequest"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            {...(inputProps as TextInputProps)}
            {...form.getInputProps("name")}
            key={form.key("name")}
            label="Name"
            required
          />
          <Textarea
            {...(textareaProps as TextareaProps)}
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
          >
            Create
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

export default CreateSidequestDrawer;
