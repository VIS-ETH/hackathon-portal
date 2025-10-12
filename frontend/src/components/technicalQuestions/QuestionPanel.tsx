import { TextInput, Textarea } from "@mantine/core";

type QuestionPanelProps = {
  question: string;
  description?: string;
  onChangeQuestion?: (newQuestion: string) => void;
  onChangeDescription?: (newDescription: string) => void;
  mode: "view" | "edit" | "grading" | "feedback" | "create";
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
  const showLines = create || mode === "edit";

  const inputQuestionStyle = showLines
    ? {
        border: "1px solid #ccc",
        fontWeight: "bold",
      }
    : {
        border: 0,
        fontWeight: "bold",
      };

  const inputDescriptionStyle = showLines
    ? {
        border: "1px solid #ccc",
        color: "dimmed",
      }
    : {
        border: 0,
        color: "dimmed",
      };

  return (
    <>
      <TextInput
        placeholder="Question"
        readOnly={viewOnly}
        value={question}
        onChange={(e) => onChangeQuestion?.(e.target.value)}
        styles={{ input: inputQuestionStyle }}
      />
      <Textarea
        placeholder={create ? "Description" : ""}
        readOnly={viewOnly}
        autosize
        minRows={2}
        value={description}
        onChange={(e) => onChangeDescription?.(e.target.value)}
        styles={{ input: inputDescriptionStyle }}
      />
    </>
  );
};

export default QuestionPanel;
