import ControlPanel from "./ControlePanel";
import PointsPanel from "./PointsPanel";
import QuestionPanel from "./QuestionPanel";

import {
  useCreateTechnicalQuestions,
  useDeleteTechnicalQuestions,
  useSetTechnicalTeamRating,
  useUpdateTechnicalQuestions,
} from "@/api/gen";
import { TechnicalQuestion as TechnicalQuestionType } from "@/api/gen/schemas";

import { useState } from "react";

import { Center, Grid } from "@mantine/core";

type TechnicalQuestionEntryProps = {
  technicalQuestion?: TechnicalQuestionType;
  initialScore?: number;
  mode: "view" | "edit" | "grading" | "feedback" | "create";
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
  const [minPoints, setMinPoints] = useState(
    technicalQuestion?.min_points || 0,
  );
  const [maxPoints, setMaxPoints] = useState(
    technicalQuestion?.max_points || 10,
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
      setMinPoints(technicalQuestion.min_points || 0);
      setMaxPoints(technicalQuestion.max_points || 10);
      setBinary(technicalQuestion.binary || false);
    }
  }
  if (initialScore !== prevInitialScore) {
    setPrevInitialScore(initialScore);
    if (initialScore !== undefined) {
      setScore(initialScore);
    }
  }

  // API calls would go here

  const createEndpoint = useCreateTechnicalQuestions();
  const updateEndpoint = useUpdateTechnicalQuestions();
  const deleteEndpoint = useDeleteTechnicalQuestions();
  const scoreEndpoint = useSetTechnicalTeamRating();

  const createMutation = async () => {
    if (mode !== "create") return;
    // Check required fields
    await createEndpoint.mutateAsync({
      eventId: eventId,
      data: {
        question,
        description,
        min_points: minPoints,
        max_points: maxPoints,
        binary,
      },
    });
  };

  const deleteMutation = async () => {
    if (mode !== "edit" || !technicalQuestion) return;
    await deleteEndpoint.mutate({
      eventId: eventId,
      questionId: technicalQuestion.id,
    });
  };

  const updateMutation = async () => {
    if (mode !== "edit" || !technicalQuestion) return;
    await updateEndpoint.mutate({
      eventId: eventId,
      questionId: technicalQuestion.id,
      data: {
        question,
        description,
        min_points: minPoints,
        max_points: maxPoints,
        binary,
      },
    });
  };

  const scoreMutation = async (newScore: number) => {
    if (mode !== "grading" || !technicalQuestion || !teamId) return;
    setScore(newScore);
    await scoreEndpoint.mutate({
      teamId: teamId,
      data: {
        question_id: technicalQuestion.id,
        score: newScore,
      },
    });
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
      onChangeScore={scoreMutation}
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
