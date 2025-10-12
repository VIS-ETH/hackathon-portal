import { Button, Group, Switch } from "@mantine/core";

type ControlPanelProps = {
  mode: "view" | "edit" | "grading" | "feedback" | "create";
  onCreate: () => Promise<void>;
  onUpdate: () => Promise<void>;
  onDelete: () => Promise<void>;
  onQuestionChange?: (binary: boolean) => void;
  booleanQuestion?: boolean;
};

const ControlPanel = ({
  mode,
  onCreate,
  onUpdate,
  onDelete,
  onQuestionChange,
  booleanQuestion,
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
      {mode === "create" && <Button onClick={onCreate}>Create</Button>}
      {mode === "edit" && (
        <>
          <Button onClick={onUpdate}>Save</Button>{" "}
          <Button onClick={onDelete}>Delete</Button>
        </>
      )}
    </Group>
  );
};

export default ControlPanel;
