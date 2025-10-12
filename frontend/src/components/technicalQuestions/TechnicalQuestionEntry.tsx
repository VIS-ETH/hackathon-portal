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

import { useEffect, useState } from "react";

import { Center, Grid } from "@mantine/core";

type TechnicalQuestionEntryProps = {
  q?: TechnicalQuestionType;
  s?: number;
  mode: "view" | "edit" | "grading" | "feedback" | "create";
  eventId: string;
  teamId?: string;
};

const TechnicalQuestionEntry = ({
  q,
  mode,
  s,
  eventId,
  teamId,
}: TechnicalQuestionEntryProps) => {
  const [question, setQuestion] = useState(q?.question || "");
  const [description, setDescription] = useState(q?.description || "");
  const [minPoints, setMinPoints] = useState(q?.min_points || 0);
  const [maxPoints, setMaxPoints] = useState(q?.max_points || 10);
  const [binary, setBinary] = useState(q?.binary || false);
  const [score, setScore] = useState<number | undefined>(s);

  useEffect(() => {
    if (q) {
      setQuestion(q.question);
      setDescription(q.description || "");
      setMinPoints(q.min_points || 0);
      setMaxPoints(q.max_points || 10);
      setBinary(q.binary || false);
    }
    if (s !== undefined) {
      setScore(s);
    }
  }, [q, s]);

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
    if (mode !== "edit" || !q) return;
    await deleteEndpoint.mutate({
      eventId: eventId,
      questionId: q.id,
    });
  };

  const updateMutation = async () => {
    if (mode !== "edit" || !q) return;
    await updateEndpoint.mutate({
      eventId: eventId,
      questionId: q.id,
      data: {
        question,
        description,
        min_points: minPoints,
        max_points: maxPoints,
        binary,
      },
    });
  };

  const scoreMutation = async (s: number) => {
    if (mode !== "grading" || !q || !teamId) return;
    setScore(s);
    await scoreEndpoint.mutate({
      teamId: teamId,
      data: {
        question_id: q.id,
        score: s,
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
