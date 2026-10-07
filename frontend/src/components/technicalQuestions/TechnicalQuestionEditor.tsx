import {
  getGetTechnicalQuestionsQueryKey,
  useCreateTechnicalQuestions,
  useDeleteTechnicalQuestions,
  useUpdateTechnicalQuestions,
} from "@/api/gen";
import { TechnicalQuestion } from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { inputProps, primaryButtonProps, textareaProps } from "@/styles/common";

import { useEffect, useState } from "react";

import {
  Button,
  Checkbox,
  Group,
  NumberInput,
  NumberInputProps,
  Stack,
  Text,
  TextInput,
  TextInputProps,
  Textarea,
} from "@mantine/core";

import { useQueryClient } from "@tanstack/react-query";

type TechnicalQuestionEditorProps = {
  // the question to edit; creates a new one if unset
  technicalQuestion?: TechnicalQuestion;
  mode: "edit" | "create";
  eventId: string;
  onUnsavedChange?: (unsaved: boolean) => void;
};

const EMPTY_QUESTION = {
  question: "",
  description: "",
  min_points: 0,
  max_points: 10,
  binary: false,
};

const TechnicalQuestionEditor = ({
  technicalQuestion,
  mode,
  eventId,
  onUnsavedChange,
}: TechnicalQuestionEditorProps) => {
  const saved = technicalQuestion ?? EMPTY_QUESTION;
  const [question, setQuestion] = useState(saved.question);
  const [description, setDescription] = useState(saved.description || "");
  // "" while the user has cleared the input
  const [minPoints, setMinPoints] = useState<number | "">(saved.min_points);
  const [maxPoints, setMaxPoints] = useState<number | "">(saved.max_points);
  const [binary, setBinary] = useState(saved.binary);
  const [prevTechnicalQuestion, setPrevTechnicalQuestion] =
    useState(technicalQuestion);

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

  const unsaved =
    question !== saved.question ||
    description !== (saved.description || "") ||
    minPoints !== saved.min_points ||
    maxPoints !== saved.max_points ||
    binary !== saved.binary;
  useUnsavedChanges(unsaved);

  useEffect(() => {
    onUnsavedChange?.(unsaved);
    return () => onUnsavedChange?.(false);
  }, [onUnsavedChange, unsaved]);

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
        setQuestion(EMPTY_QUESTION.question);
        setDescription(EMPTY_QUESTION.description);
        setMinPoints(EMPTY_QUESTION.min_points);
        setMaxPoints(EMPTY_QUESTION.max_points);
        setBinary(EMPTY_QUESTION.binary);
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

  return (
    <Stack>
      <TextInput
        {...(inputProps as TextInputProps)}
        label="Question"
        value={question}
        onChange={(e) => setQuestion(e.currentTarget.value)}
      />
      <Textarea
        {...textareaProps}
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
      />
      <Group grow>
        <NumberInput
          {...(inputProps as NumberInputProps)}
          label="Min points"
          value={minPoints}
          onChange={(value) =>
            setMinPoints(typeof value === "number" ? value : "")
          }
          allowDecimal={false}
        />
        <NumberInput
          {...(inputProps as NumberInputProps)}
          label="Max points"
          value={maxPoints}
          onChange={(value) =>
            setMaxPoints(typeof value === "number" ? value : "")
          }
          allowDecimal={false}
        />
      </Group>
      <Group justify="space-between">
        <Checkbox
          label="Binary question"
          description="Graded with either the min or the max points"
          checked={binary}
          onChange={(e) => setBinary(e.currentTarget.checked)}
        />
        <Group gap="xs">
          {validationError && (
            <Text c="red" size="sm">
              {validationError}
            </Text>
          )}
          {mode === "create" ? (
            <Button
              {...primaryButtonProps}
              disabled={!!validationError}
              loading={createEndpoint.isPending}
              onClick={createMutation}
            >
              Create
            </Button>
          ) : (
            <>
              <Button
                {...primaryButtonProps}
                disabled={!!validationError}
                loading={updateEndpoint.isPending}
                onClick={updateMutation}
              >
                Save
              </Button>
              <Button
                {...primaryButtonProps}
                color="red"
                loading={deleteEndpoint.isPending}
                onClick={deleteMutation}
              >
                Delete
              </Button>
            </>
          )}
        </Group>
      </Group>
    </Stack>
  );
};

export default TechnicalQuestionEditor;
