import { TechnicalQuestionMode } from "./types";

import { TextInput, Textarea } from "@mantine/core";

type QuestionPanelProps = {
  question: string;
  description?: string;
  onChangeQuestion?: (newQuestion: string) => void;
  onChangeDescription?: (newDescription: string) => void;
  mode: TechnicalQuestionMode;
};

const QuestionPanel = ({
  question,
  description,
  onChangeQuestion,
  onChangeDescription,
  mode,
}: QuestionPanelProps) => {
  const viewOnly = mode === "view" || mode === "grading" || mode === "feedback";
  const create = mode === "create";

  return (
    <>
      <TextInput
        placeholder="Question"
        readOnly={viewOnly}
        value={question}
        onChange={(e) => onChangeQuestion?.(e.target.value)}
        variant={viewOnly ? "unstyled" : "default"}
        styles={{ input: { fontWeight: "bold" } }}
      />
      <Textarea
        placeholder={create ? "Description" : ""}
        readOnly={viewOnly}
        autosize
        minRows={2}
        value={description}
        onChange={(e) => onChangeDescription?.(e.target.value)}
        variant={viewOnly ? "unstyled" : "default"}
        styles={{ input: { color: "var(--mantine-color-dimmed)" } }}
      />
    </>
  );
};

export default QuestionPanel;
