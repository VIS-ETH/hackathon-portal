import { TechnicalQuestionMode } from "./types";

import { Button, Group, Switch, Text } from "@mantine/core";

type ControlPanelProps = {
  mode: TechnicalQuestionMode;
  onCreate: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onQuestionChange?: (binary: boolean) => void;
  booleanQuestion?: boolean;
  validationError?: string;
};

const ControlPanel = ({
  mode,
  onCreate,
  onUpdate,
  onDelete,
  onQuestionChange,
  booleanQuestion,
  validationError,
}: ControlPanelProps) => {
  if (mode === "view" || mode === "grading" || mode === "feedback") {
    return null;
  }

  return (
    <Group gap="xs" justify="flex-end">
      {
        <Switch
          label={booleanQuestion ? "Binary Question" : "Continuous Points"}
          checked={booleanQuestion}
          onChange={(event) => onQuestionChange?.(event.currentTarget.checked)}
        />
      }
      {mode === "create" && (
        <Button onClick={onCreate} disabled={!!validationError}>
          Create
        </Button>
      )}
      {mode === "edit" && (
        <>
          <Button onClick={onUpdate} disabled={!!validationError}>
            Save
          </Button>{" "}
          <Button onClick={onDelete}>Delete</Button>
        </>
      )}
      {validationError && (
        <Text c="red" size="sm">
          {validationError}
        </Text>
      )}
    </Group>
  );
};

export default ControlPanel;
