import MarkdownCard from "../MarkdownCard";

import { useUpdateEvent } from "@/api/gen";
import { Event } from "@/api/gen/schemas";
import { primaryButtonProps, textareaProps } from "@/styles/common";

import { useState } from "react";

import { Button, Group, Stack, Textarea, TextareaProps } from "@mantine/core";

type DocumentationContentControlsProps = {
  event: Event;
  refetch?: () => void;
};

const DocumentationContentControls = ({
  event,
  refetch,
}: DocumentationContentControlsProps) => {
  const [localContent, setLocalContent] = useState(
    event.documentation_content || "",
  );

  const updateEventMutation = useUpdateEvent();

  const hasChanges = localContent !== event.documentation_content;

  const handleSave = async () => {
    await updateEventMutation.mutateAsync({
      eventId: event.id,
      data: {
        documentation_content: localContent,
      },
    });

    refetch?.();
  };

  return (
    <Stack>
      <Textarea
        {...(textareaProps as TextareaProps)}
        value={localContent}
        onChange={(e) => setLocalContent(e.currentTarget.value)}
        label="Documentation Content"
        description="Supports Markdown. Concurrent editing causes DATA LOSS."
      />
      <Group>
        <Button
          {...primaryButtonProps}
          disabled={!hasChanges}
          onClick={handleSave}
        >
          Save
        </Button>
      </Group>
      <MarkdownCard content={localContent} />
    </Stack>
  );
};

export default DocumentationContentControls;
