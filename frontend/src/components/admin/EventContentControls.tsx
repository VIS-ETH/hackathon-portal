import MarkdownCard from "../MarkdownCard";

import { useUpdateEvent } from "@/api/gen";
import { Event } from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { primaryButtonProps, textareaProps } from "@/styles/common";

import { useState } from "react";

import { Button, Group, Stack, Textarea } from "@mantine/core";

type EventContentControlsProps = {
  event: Event;
  field: "welcome_content" | "documentation_content";
  label: string;
  refetch?: () => void;
};

const EventContentControls = ({
  event,
  field,
  label,
  refetch,
}: EventContentControlsProps) => {
  const [localContent, setLocalContent] = useState(event[field] || "");

  const updateEventMutation = useUpdateEvent();

  const hasChanges = localContent !== (event[field] ?? "");
  useUnsavedChanges(hasChanges);

  const handleSave = async () => {
    await updateEventMutation.mutateAsync({
      eventId: event.id,
      data: {
        [field]: localContent,
      },
    });

    refetch?.();
  };

  return (
    <Stack>
      <Textarea
        {...textareaProps}
        value={localContent}
        onChange={(e) => setLocalContent(e.currentTarget.value)}
        label={label}
        description={
          <>
            Supports Markdown and HTML. Concurrent editing causes{" "}
            <strong>data loss</strong>.
          </>
        }
      />
      <Group>
        <Button
          {...primaryButtonProps}
          disabled={!hasChanges}
          onClick={handleSave}
          loading={updateEventMutation.isPending}
        >
          Save
        </Button>
      </Group>
      <MarkdownCard trusted content={localContent} allowHtml />
    </Stack>
  );
};

export default EventContentControls;
