import ExpertRating from "../rating/ExpertRating";
import OverviewLeaderboardTable from "../sidequest/OverviewLeaderboardTable";
import TechnicalQuestionEntry from "../technicalQuestions/TechnicalQuestionEntry";
import ScoreDisplay from "./ScoreDisplay";

import { useGetTeam, useGetTechnicalTeamRating } from "@/api/gen";
import { ScoreNormalized } from "@/api/gen/schemas";
import { useResolveParams } from "@/hooks/useResolveParams";
import {
  cardHeaderTextProps,
  cardProps,
  cardSectionProps,
} from "@/styles/common";
import { fmtScore } from "@/utils";

import {
  Card,
  Group,
  Loader,
  Text,
  Title,
} from "@mantine/core";

import { IconTrophy } from "@tabler/icons-react";

type CategoryTitleProps = {
  title: string;
  rank: number;
  score: number;
  normalized_score: number;
};

const CategoryTitle = ({
  title,
  rank,
  score,
  normalized_score,
}: CategoryTitleProps) => {
  return (
    <Group justify="space-between">
      <Text {...cardHeaderTextProps}>{title}</Text>
      <Group>
        <Text c="dimmed">Rank</Text> #{rank}
        <Text c="dimmed">Score</Text> {fmtScore(score)}
        <Text c="dimmed">Normalized Score</Text> {fmtScore(normalized_score)}
      </Group>
    </Group>
  );
};

type RatingFeedbackCardProps = {
  rating: ScoreNormalized;
  limitedView?: boolean;
};

const RatingFeedbackCard = ({
  rating,
  limitedView = false,
}: RatingFeedbackCardProps) => {
  const { event } = useResolveParams();
  const { data: questions } = useGetTechnicalTeamRating(rating.team_id);

  const { data: team } = useGetTeam(rating.team_id);

  const placements = [
    { id: 1, place: "first", icon: <IconTrophy size={20} color="gold" /> },
    { id: 2, place: "second", icon: <IconTrophy size={20} color="silver" /> },
    { id: 3, place: "third", icon: <IconTrophy size={20} color="#CD7F32" /> },
  ];

  if (!event || !team) {
    return <Loader />;
  }

  return (
    <>
      <Group>
        {!limitedView && (
          <Group w="100%" justify="space-between">
            <Title order={3}>Feedback</Title>
            <Group gap={0}>
              <Title order={3} c="dimmed">
                Overall Rank #{rating.rank}
              </Title>
            </Group>
          </Group>
        )}
      </Group>

      {!limitedView && (
        <ScoreDisplay
          technical_score={rating.tech_score?.score_normalized ?? 0}
          presentation_score={rating.expert_score?.score_normalized ?? 0}
          sidequest_score={rating.sidequest_score?.score_normalized ?? 0}
          public_voting_score={rating.voting_score?.score_normalized ?? 0}
          extra_score={rating.extra_score}
          max_score={rating.max_final_score ?? 0}
        />
      )}

      {rating.tech_score && (
        <Card {...cardProps}>
          <Card.Section {...cardSectionProps}>
            <CategoryTitle
              title="Technical Ranking"
              rank={rating.tech_score.category_rank}
              score={rating.tech_score.score}
              normalized_score={rating.tech_score.score_normalized}
            />
          </Card.Section>
          {questions &&
            questions.map((q) => (
              <Card.Section key={q.question.id} {...cardSectionProps}>
                <TechnicalQuestionEntry
                  key={q.question.id}
                  q={q.question}
                  teamId={rating.team_id}
                  s={q.points ?? undefined}
                  mode="feedback"
                  eventId={event.id}
                />
              </Card.Section>
            ))}
        </Card>
      )}

      {rating.expert_score && (
        <Card {...cardProps}>
          <Card.Section {...cardSectionProps}>
            <CategoryTitle
              title="Expert Ranking"
              rank={rating.expert_score.category_rank}
              score={rating.expert_score.score}
              normalized_score={rating.expert_score.score_normalized}
            />
          </Card.Section>
          <Card.Section {...cardSectionProps}>
            <ExpertRating
              category="Presentation"
              rating={rating.expert_score.presentation_score}
              feedbackOnly
            />
          </Card.Section>
          <Card.Section {...cardSectionProps}>
            <ExpertRating
              category="Product"
              rating={rating.expert_score.product_score}
              feedbackOnly
            />
          </Card.Section>
        </Card>
      )}

      {rating.sidequest_score && (
        <Card {...cardProps}>
          <Card.Section {...cardSectionProps}>
            <CategoryTitle
              title="Sidequest Ranking"
              rank={rating.sidequest_score.category_rank}
              score={rating.sidequest_score.score}
              normalized_score={rating.sidequest_score.score_normalized}
            />
          </Card.Section>
          {!limitedView && (
            <Card.Section {...cardSectionProps}>
              <OverviewLeaderboardTable eventId={event.id} />
            </Card.Section>
          )}
        </Card>
      )}

      {team.finalist && rating.voting_score && (
        <Card {...cardProps}>
          <Card.Section {...cardSectionProps}>
            <CategoryTitle
              title="Public Voting Ranking"
              rank={rating.voting_score.category_rank}
              score={rating.voting_score.score}
              normalized_score={rating.voting_score.score_normalized}
            />
          </Card.Section>
          <Card.Section {...cardSectionProps}>
            <Group justify="space-between">
              {placements.map(({ id, place, icon }) => (
                <Group key={id}>
                  {icon}
                  <Text fw={600} size="lg">
                    {rating.voting_score?.votes[id] || 0}
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
