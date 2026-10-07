import LabeledRow from "../LabeledRow";
import TechnicalQuestionEditor from "./TechnicalQuestionEditor";
import TechnicalQuestionGrading from "./TechnicalQuestionGrading";
import { TechnicalQuestionMode } from "./types";

import { TechnicalQuestion as TechnicalQuestionType } from "@/api/gen/schemas";

import { Text } from "@mantine/core";

type TechnicalQuestionEntryProps = {
  technicalQuestion?: TechnicalQuestionType;
  initialScore?: number;
  mode: TechnicalQuestionMode;
  eventId: string;
  teamId?: string;
  onUnsavedChange?: (unsaved: boolean) => void;
};

const TechnicalQuestionEntry = ({
  technicalQuestion,
  mode,
  initialScore,
  eventId,
  teamId,
  onUnsavedChange,
}: TechnicalQuestionEntryProps) => {
  if (mode === "edit" || mode === "create") {
    return (
      <TechnicalQuestionEditor
        technicalQuestion={technicalQuestion}
        mode={mode}
        eventId={eventId}
        onUnsavedChange={onUnsavedChange}
      />
    );
  }

  if (!technicalQuestion) {
    return null;
  }

  if (mode === "grading") {
    return (
      teamId && (
        <TechnicalQuestionGrading
          technicalQuestion={technicalQuestion}
          initialScore={initialScore}
          teamId={teamId}
        />
      )
    );
  }

  const { binary, min_points, max_points } = technicalQuestion;

  if (mode === "feedback") {
    // binary questions are scored with either min or max points
    const score =
      initialScore === undefined
        ? "–"
        : binary
          ? initialScore == max_points
            ? max_points
            : min_points
          : initialScore;
    return (
      <LabeledRow
        label={technicalQuestion.question}
        description={technicalQuestion.description}
      >
        <Text>
          {score}
          <Text span c="dimmed">{` / ${max_points}`}</Text>
        </Text>
      </LabeledRow>
    );
  }

  return (
    <LabeledRow
      label={technicalQuestion.question}
      description={technicalQuestion.description}
    >
      <Text>
        {binary
          ? `Binary · ${min_points} / ${max_points}`
          : `${min_points}–${max_points}`}
      </Text>
    </LabeledRow>
  );
};

export default TechnicalQuestionEntry;
