import EventContentControls from "./EventContentControls";

import { Event } from "@/api/gen/schemas";
import ScrollableSegmentedControl from "@/components/ScrollableSegmentedControl";
import { confirmDiscard } from "@/hooks/useUnsavedChanges";

import { useState } from "react";

import { Group, Stack } from "@mantine/core";

const TARGETS = {
  welcome: { field: "welcome_content", label: "Welcome content" },
  documentation: {
    field: "documentation_content",
    label: "Documentation content",
  },
} as const;

type Target = keyof typeof TARGETS;

const TARGET_TABS = [
  { label: "Welcome", value: "welcome" },
  { label: "Documentation", value: "documentation" },
];

type EventContentTabProps = {
  event: Event;
  refetch?: () => void;
};

const EventContentTab = ({ event, refetch }: EventContentTabProps) => {
  const [target, setTarget] = useState<Target>("welcome");

  const handleTargetChange = (value: string) => {
    // Switching unmounts the controls, which discards their draft.
    if (value !== target && confirmDiscard()) {
      setTarget(value as Target);
    }
  };

  return (
    <Stack>
      <Group>
        <ScrollableSegmentedControl
          data={TARGET_TABS}
          value={target}
          onChange={handleTargetChange}
        />
      </Group>
      <EventContentControls
        key={target}
        event={event}
        field={TARGETS[target].field}
        label={TARGETS[target].label}
        refetch={refetch}
      />
    </Stack>
  );
};

export default EventContentTab;
