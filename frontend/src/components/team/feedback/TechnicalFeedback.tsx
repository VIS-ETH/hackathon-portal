import TechnicalQuestionEntry from "../../technicalQuestions/TechnicalQuestionEntry";
import FeedbackCard from "./FeedbackCard";

import { TeamRanking, TechnicalQuestion } from "@/api/gen/schemas";

import { useMemo } from "react";

type TechnicalFeedbackProps = {
  entry: TeamRanking;
  eventId: string;
};

const TechnicalFeedback = ({ entry, eventId }: TechnicalFeedbackProps) => {
  // the answers are part of the ranking, so they show the questions as they were when it
  // was computed; memoized because TechnicalQuestionEntry resets on a new question object
  const answers = useMemo(
    () =>
      (entry.technical.answers ?? []).map((answer) => ({
        question: {
          id: answer.question_id,
          event_id: eventId,
          question: answer.question,
          description: answer.description,
          min_points: answer.min_points,
          max_points: answer.max_points,
          binary: answer.binary,
        } satisfies TechnicalQuestion,
        score: answer.score,
      })),
    [entry.technical.answers, eventId],
  );

  return (
    <FeedbackCard
      title="Technical Ranking"
      category={entry.technical}
      rows={answers.map((answer) => ({
        key: answer.question.id,
        content: (
          <TechnicalQuestionEntry
            technicalQuestion={answer.question}
            teamId={entry.team_id}
            initialScore={answer.score ?? undefined}
            mode="feedback"
            eventId={eventId}
          />
        ),
      }))}
    />
  );
};

export default TechnicalFeedback;
