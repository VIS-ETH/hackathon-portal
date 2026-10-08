import LabeledRow from "../../LabeledRow";
import FeedbackCard from "./FeedbackCard";

import { TeamRanking } from "@/api/gen/schemas";

import { Text } from "@mantine/core";

type TechnicalFeedbackProps = {
  entry: TeamRanking;
};

const TechnicalFeedback = ({ entry }: TechnicalFeedbackProps) => {
  // the answers are part of the ranking, so they show the questions as they were when it
  // was computed
  return (
    <FeedbackCard
      title="Technical Ranking"
      category={entry.technical}
      rows={(entry.technical.answers ?? []).map((answer) => {
        const { binary, min_points, max_points, score } = answer;
        // binary questions are scored with either min or max points
        const points =
          score === null || score === undefined
            ? "–"
            : binary
              ? score === max_points
                ? max_points
                : min_points
              : score;

        return {
          key: answer.question_id,
          content: (
            <LabeledRow
              label={answer.question}
              description={answer.description}
            >
              <Text>
                {points}
                <Text span c="dimmed">{` / ${max_points}`}</Text>
              </Text>
            </LabeledRow>
          ),
        };
      })}
    />
  );
};

export default TechnicalFeedback;
