import JuryRating from "../rating/JuryRating";
import OverviewLeaderboardTable from "../sidequest/OverviewLeaderboardTable";
import TechnicalQuestionEntry from "../technicalQuestions/TechnicalQuestionEntry";
import ScoreDisplay from "./ScoreDisplay";

import { TeamRanking, TechnicalQuestion } from "@/api/gen/schemas";
import { useResolveParams } from "@/hooks/useResolveParams";
import {
  cardHeaderTextProps,
  cardProps,
  cardSectionProps,
} from "@/styles/common";
import { fmtScore } from "@/utils";

import { useMemo } from "react";

import { Card, Group, Loader, Text, Title } from "@mantine/core";

import { IconTrophy } from "@tabler/icons-react";

type CategoryTitleProps = {
  title: string;
  category: { rank: number; score: number; points: number };
};

const CategoryTitle = ({ title, category }: CategoryTitleProps) => {
  return (
    <Group justify="space-between">
      <Text {...cardHeaderTextProps}>{title}</Text>
      <Group>
        <Text c="dimmed">Rank</Text> #{category.rank}
        <Text c="dimmed">Score</Text> {fmtScore(category.score)}
        <Text c="dimmed">Points</Text> {fmtScore(category.points)}
      </Group>
    </Group>
  );
};

type RatingFeedbackCardProps = {
  entry: TeamRanking;
  // the admin view leaves out the overview
  adminView?: boolean;
  // only used outside the admin view
  maxTotalPoints?: number;
};

const RatingFeedbackCard = ({
  entry,
  adminView = false,
  maxTotalPoints = 0,
}: RatingFeedbackCardProps) => {
  const { event } = useResolveParams();

  // the answers are part of the ranking, so they show the questions as they were when it
  // was computed; memoized because TechnicalQuestionEntry resets on a new question object
  const answers = useMemo(
    () =>
      (entry.technical.answers ?? []).map((answer) => ({
        question: {
          id: answer.question_id,
          event_id: event?.id ?? "",
          question: answer.question,
          description: answer.description,
          min_points: answer.min_points,
          max_points: answer.max_points,
          binary: answer.binary,
        } satisfies TechnicalQuestion,
        score: answer.score,
      })),
    [entry.technical.answers, event?.id],
  );

  const placements = [
    { id: 1, place: "first", icon: <IconTrophy size={20} color="gold" /> },
    { id: 2, place: "second", icon: <IconTrophy size={20} color="silver" /> },
    { id: 3, place: "third", icon: <IconTrophy size={20} color="#CD7F32" /> },
  ];

  if (!event) {
    return <Loader />;
  }

  return (
    <>
      <Group>
        {!adminView && (
          <Group w="100%" justify="space-between">
            <Title order={3}>Feedback</Title>
            <Group gap={0}>
              <Title order={3} c="dimmed">
                Overall Rank #{entry.rank}
              </Title>
            </Group>
          </Group>
        )}
      </Group>

      {!adminView && (
        <ScoreDisplay entry={entry} maxTotalPoints={maxTotalPoints} />
      )}

      <Card {...cardProps}>
        <Card.Section {...cardSectionProps}>
          <CategoryTitle title="Technical Ranking" category={entry.technical} />
        </Card.Section>
        {answers.map((answer) => (
          <Card.Section key={answer.question.id} {...cardSectionProps}>
            <TechnicalQuestionEntry
              technicalQuestion={answer.question}
              teamId={entry.team_id}
              initialScore={answer.score ?? undefined}
              mode="feedback"
              eventId={event.id}
            />
          </Card.Section>
        ))}
      </Card>

      <Card {...cardProps}>
        <Card.Section {...cardSectionProps}>
          <CategoryTitle title="Jury Ranking" category={entry.jury} />
        </Card.Section>
        <Card.Section {...cardSectionProps}>
          <JuryRating
            category="Presentation"
            rating={entry.jury.presentation_score}
            feedbackOnly
          />
        </Card.Section>
        <Card.Section {...cardSectionProps}>
          <JuryRating
            category="Product"
            rating={entry.jury.product_score}
            feedbackOnly
          />
        </Card.Section>
      </Card>

      <Card {...cardProps}>
        <Card.Section {...cardSectionProps}>
          <CategoryTitle title="Sidequest Ranking" category={entry.sidequest} />
        </Card.Section>
        {!adminView && (
          <Card.Section {...cardSectionProps}>
            <OverviewLeaderboardTable eventId={event.id} />
          </Card.Section>
        )}
      </Card>

      {entry.finalist && (
        <Card {...cardProps}>
          <Card.Section {...cardSectionProps}>
            <CategoryTitle title="Public Ranking" category={entry.public} />
          </Card.Section>
          <Card.Section {...cardSectionProps}>
            <Group justify="space-between">
              {placements.map(({ id, place, icon }) => (
                <Group key={id}>
                  {icon}
                  <Text fw={600} size="lg">
                    {entry.public.votes[id] || 0}
                  </Text>
                  <Text c="dimmed" size="sm">
                    {place} place votes
                  </Text>
                </Group>
              ))}
            </Group>
          </Card.Section>
        </Card>
      )}
    </>
  );
};

export default RatingFeedbackCard;
