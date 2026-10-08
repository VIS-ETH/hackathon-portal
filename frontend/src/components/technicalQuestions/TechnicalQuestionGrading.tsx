import LabeledRow from "../LabeledRow";

import {
  getGetTechnicalTeamRatingQueryKey,
  useSetTechnicalTeamRating,
} from "@/api/gen";
import { TechnicalQuestion } from "@/api/gen/schemas";
import { badgeProps, iconProps, toolbarButtonProps } from "@/styles/common";

import { useState } from "react";

import { Badge, Button, Slider, Stack, Text } from "@mantine/core";

import { IconAlertTriangle } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";

type TechnicalQuestionGradingProps = {
  technicalQuestion: TechnicalQuestion;
  // the persisted score; unset while ungraded
  initialScore?: number;
  teamId: string;
};

const TechnicalQuestionGrading = ({
  technicalQuestion,
  initialScore,
  teamId,
}: TechnicalQuestionGradingProps) => {
  const [score, setScore] = useState<number | undefined>(initialScore);
  const [prevInitialScore, setPrevInitialScore] = useState(initialScore);

  if (initialScore !== prevInitialScore) {
    setPrevInitialScore(initialScore);
    setScore(initialScore);
  }

  const queryClient = useQueryClient();
  const scoreEndpoint = useSetTechnicalTeamRating({
    mutation: {
      onSuccess: (_, { teamId }) =>
        queryClient.invalidateQueries({
          queryKey: getGetTechnicalTeamRatingQueryKey(teamId),
        }),
    },
  });

  const scoreMutation = (newScore: number) => {
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

  const { binary, min_points, max_points } = technicalQuestion;

  return (
    <LabeledRow
      label={technicalQuestion.question}
      description={technicalQuestion.description}
    >
      <Stack gap="xs" align="flex-end">
        {binary ? (
          <Button.Group>
            <Button
              {...toolbarButtonProps}
              variant={
                score !== undefined && score !== max_points
                  ? "filled"
                  : "default"
              }
              onClick={() => scoreMutation(min_points)}
            >
              No
            </Button>
            <Button
              {...toolbarButtonProps}
              variant={score === max_points ? "filled" : "default"}
              onClick={() => scoreMutation(max_points)}
            >
              Yes
            </Button>
          </Button.Group>
        ) : (
          <Slider
            w="100%"
            mb="md"
            min={min_points}
            max={max_points}
            // string labels: Mantine renders `label && …`, so a 0 label would show as a bare 0
            marks={[
              { value: min_points, label: String(min_points) },
              { value: max_points, label: String(max_points) },
            ]}
            value={score ?? min_points}
            color={score === undefined ? "gray" : undefined}
            onChange={setScore}
            onChangeEnd={scoreMutation}
          />
        )}
        {score === undefined ? (
          <Badge
            {...badgeProps}
            variant="light"
            color="yellow"
            leftSection={<IconAlertTriangle {...iconProps} />}
          >
            Ungraded
          </Badge>
        ) : (
          <Text>
            {score}
            <Text span c="dimmed">{` / ${max_points}`}</Text>
          </Text>
        )}
      </Stack>
    </LabeledRow>
  );
};

export default TechnicalQuestionGrading;
