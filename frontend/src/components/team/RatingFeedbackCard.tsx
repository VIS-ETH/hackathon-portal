import ExpertRating from "../rating/ExpertRating";
import OverviewLeaderboardTable from "../sidequest/OverviewLeaderboardTable";
import TechnicalQuestionEntry from "../technicalQuestions/TechnicalQuestionEntry";
import ScoreDisplay from "./ScoreDisplay";

import { useGetTeam, useGetTechnicalTeamRating } from "@/api/gen";
import { ScoreNormalized } from "@/api/gen/schemas";
import { useResolveParams } from "@/hooks/useResolveParams";
import { cardProps } from "@/styles/common";
import { fmtScore } from "@/utils";

import {
  Box,
  Card,
  Divider,
  Flex,
  Grid,
  Group,
  Loader,
  SimpleGrid,
  Stack,
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
    <Grid w={"100%"} mb={"md"}>
      <Grid.Col span={4}>
        <Title order={4}>{title}</Title>
      </Grid.Col>
      <Grid.Col span={2}>
        <Text>Rank: {rank}</Text>
      </Grid.Col>
      <Grid.Col span={2}>
        <Text>Score: {fmtScore(score)}</Text>
      </Grid.Col>
      <Grid.Col span={4}>
        <Text>Normalized Score: {fmtScore(normalized_score)}</Text>
      </Grid.Col>
    </Grid>
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
          <>
            <Title order={3}>Feedback</Title>
            <Group gap={0}>
              <IconTrophy />
              <Text fz="xl" fw={700}>
                #{rating.rank}
              </Text>
            </Group>
          </>
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
          <Group justify="center">
            <CategoryTitle
              title="Technical Ranking"
              rank={rating.tech_score.category_rank}
              score={rating.tech_score.score}
              normalized_score={rating.tech_score.score_normalized}
            />
          </Group>
          <Stack gap={0}>
            {questions &&
              questions.map((q, i) => (
                <Box key={q.question.id}>
                  <TechnicalQuestionEntry
                    key={q.question.id}
                    q={q.question}
                    teamId={rating.team_id}
                    s={q.points ?? undefined}
                    mode="feedback"
                    eventId={event.id}
                  />
                  {i < questions.length - 1 && <Divider />}
                </Box>
              ))}
          </Stack>
        </Card>
      )}

      {rating.expert_score && (
        <Card {...cardProps}>
          <Group justify="center">
            <CategoryTitle
              title="Expert Ranking"
              rank={rating.expert_score.category_rank}
              score={rating.expert_score.score}
              normalized_score={rating.expert_score.score_normalized}
            />
          </Group>
          <SimpleGrid cols={2}>
            <Group>
              <ExpertRating
                category="Presentation"
                rating={rating.expert_score.presentation_score}
                feedbackOnly
              />
            </Group>
            <Group>
              <ExpertRating
                category="Product"
                rating={rating.expert_score.product_score}
                feedbackOnly
              />
            </Group>
          </SimpleGrid>
        </Card>
      )}

      {rating.sidequest_score && (
        <Card {...cardProps}>
          <Group justify="center">
            <CategoryTitle
              title="Sidequest Ranking"
              rank={rating.sidequest_score.category_rank}
              score={rating.sidequest_score.score}
              normalized_score={rating.sidequest_score.score_normalized}
            />
          </Group>
          {!limitedView && <OverviewLeaderboardTable eventId={event.id} />}
        </Card>
      )}
      {team.finalist && rating.voting_score && (
        <Card {...cardProps}>
          <Group justify="center">
            <CategoryTitle
              title="Public Voting Ranking"
              rank={rating.voting_score.category_rank}
              score={rating.voting_score.score}
              normalized_score={rating.voting_score.score_normalized}
            />
          </Group>
          <Flex justify="space-between" w="100%">
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
          </Flex>
        </Card>
      )}
    </>
  );
};

export default RatingFeedbackCard;
