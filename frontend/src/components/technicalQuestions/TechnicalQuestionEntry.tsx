import ControlPanel from "./ControlPanel";
import PointsPanel from "./PointsPanel";
import QuestionPanel from "./QuestionPanel";
import { TechnicalQuestionMode } from "./types";

import {
  getGetTechnicalQuestionsQueryKey,
  getGetTechnicalTeamRatingQueryKey,
  useCreateTechnicalQuestions,
  useDeleteTechnicalQuestions,
  useSetTechnicalTeamRating,
  useUpdateTechnicalQuestions,
} from "@/api/gen";
import { TechnicalQuestion as TechnicalQuestionType } from "@/api/gen/schemas";

import { useState } from "react";

import { Center, Grid } from "@mantine/core";

import { useQueryClient } from "@tanstack/react-query";

type TechnicalQuestionEntryProps = {
  technicalQuestion?: TechnicalQuestionType;
  initialScore?: number;
  mode: TechnicalQuestionMode;
  eventId: string;
  teamId?: string;
};

const TechnicalQuestionEntry = ({
  technicalQuestion,
  mode,
  initialScore,
  eventId,
  teamId,
}: TechnicalQuestionEntryProps) => {
  const [question, setQuestion] = useState(technicalQuestion?.question || "");
  const [description, setDescription] = useState(
    technicalQuestion?.description || "",
  );
  // "" while the user has cleared the input
  const [minPoints, setMinPoints] = useState<number | "">(
    technicalQuestion?.min_points ?? 0,
  );
  const [maxPoints, setMaxPoints] = useState<number | "">(
    technicalQuestion?.max_points ?? 10,
  );
  const [binary, setBinary] = useState(technicalQuestion?.binary || false);
  const [score, setScore] = useState<number | undefined>(initialScore);
  const [prevTechnicalQuestion, setPrevTechnicalQuestion] =
    useState(technicalQuestion);
  const [prevInitialScore, setPrevInitialScore] = useState(initialScore);

  if (technicalQuestion !== prevTechnicalQuestion) {
    setPrevTechnicalQuestion(technicalQuestion);
    if (technicalQuestion) {
      setQuestion(technicalQuestion.question);
      setDescription(technicalQuestion.description || "");
      setMinPoints(technicalQuestion.min_points);
      setMaxPoints(technicalQuestion.max_points);
      setBinary(technicalQuestion.binary || false);
    }
  }
  if (initialScore !== prevInitialScore) {
    setPrevInitialScore(initialScore);
    setScore(initialScore);
  }

  const validationError = !question.trim()
    ? "Question must not be empty"
    : minPoints === "" || maxPoints === ""
      ? "Min and max points are required"
      : minPoints >= maxPoints
        ? "Min points must be lower than max points"
        : undefined;

  const queryClient = useQueryClient();
  const refetchQuestions = () =>
    queryClient.invalidateQueries({
      queryKey: getGetTechnicalQuestionsQueryKey(eventId),
    });
  const createEndpoint = useCreateTechnicalQuestions({
    mutation: {
      onSuccess: () => {
        setQuestion("");
        setDescription("");
        setMinPoints(0);
        setMaxPoints(10);
        setBinary(false);
        return refetchQuestions();
      },
    },
  });
  const updateEndpoint = useUpdateTechnicalQuestions({
    mutation: { onSuccess: refetchQuestions },
  });
  const deleteEndpoint = useDeleteTechnicalQuestions({
    mutation: { onSuccess: refetchQuestions },
  });
  const scoreEndpoint = useSetTechnicalTeamRating({
    mutation: {
      onSuccess: (_, { teamId }) =>
        queryClient.invalidateQueries({
          queryKey: getGetTechnicalTeamRatingQueryKey(teamId),
        }),
    },
  });

  const createMutation = () => {
    if (mode !== "create" || validationError) return;
    createEndpoint.mutate({
      eventId: eventId,
      data: {
        question,
        description,
        // validationError guarantees both are numbers here
        min_points: Number(minPoints),
        max_points: Number(maxPoints),
        binary,
      },
    });
  };

  const deleteMutation = () => {
    if (mode !== "edit" || !technicalQuestion) return;
    const confirmation = window.confirm(
      `Are you sure you want to delete "${technicalQuestion.question}"? All scores given for it will be deleted as well.`,
    );
    if (!confirmation) return;
    deleteEndpoint.mutate({
      eventId: eventId,
      questionId: technicalQuestion.id,
    });
  };

  const updateMutation = () => {
    if (mode !== "edit" || !technicalQuestion || validationError) return;
    updateEndpoint.mutate({
      eventId: eventId,
      questionId: technicalQuestion.id,
      data: {
        question,
        description,
        // validationError guarantees both are numbers here
        min_points: Number(minPoints),
        max_points: Number(maxPoints),
        binary,
      },
    });
  };

  const scoreMutation = (newScore: number) => {
    if (mode !== "grading" || !technicalQuestion || !teamId) return;
    setScore(newScore);
    scoreEndpoint.mutate(
      {
        teamId: teamId,
        data: {
          question_id: technicalQuestion.id,
          score: newScore,
        },
      },
      // Revert to the last persisted score; the error itself is surfaced
      // by the global MutationCache handler.
      { onError: () => setScore(initialScore) },
    );
  };

  const columnWidths = {
    view: [8, 4],
    edit: [6, 3, 3],
    grading: [8, 4],
    feedback: [8, 4],
    create: [6, 3, 3],
  };

  const questionPanel = (
    <QuestionPanel
      mode={mode}
      question={question}
      description={description}
      onChangeQuestion={setQuestion}
      onChangeDescription={setDescription}
    />
  );

  const pointPanel = (
    <PointsPanel
      mode={mode}
      minPoints={minPoints}
      maxPoints={maxPoints}
      numericScore={score}
      binaryChoice={binary}
      binaryScore={score == maxPoints}
      onChangeMinPoints={setMinPoints}
      onChangeMaxPoints={setMaxPoints}
      onChangeScore={setScore}
      onCommitScore={scoreMutation}
    />
  );

  const controlPanel = (
    <ControlPanel
      mode={mode}
      onCreate={createMutation}
      onUpdate={updateMutation}
      onDelete={deleteMutation}
      onQuestionChange={setBinary}
      booleanQuestion={binary}
      validationError={validationError}
    />
  );

  return (
    <Grid>
      {/* Question Panel */}
      <Grid.Col span={columnWidths[mode][0]}>{questionPanel}</Grid.Col>
      {/* Points panel*/}
      <Grid.Col span={columnWidths[mode][1]}>
        <Center h="100%">{pointPanel}</Center>
      </Grid.Col>
      {/* Action buttons */}
      <Grid.Col span={columnWidths[mode][2] || 0}>{controlPanel}</Grid.Col>
    </Grid>
  );
};

export default TechnicalQuestionEntry;
