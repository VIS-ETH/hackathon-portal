import CardHeader from "../CardHeader";
import Markdown from "../Markdown";
import TeamDetailsCard from "../team/TeamDetailsCard";
import TechnicalQuestionEntry from "../technicalQuestions/TechnicalQuestionEntry";
import JuryRatingInput from "./JuryRating/JuryRatingInput";

import { useGetProject, useGetTechnicalTeamRating } from "@/api/gen";
import { JuryRatingCategory, Team } from "@/api/gen/schemas";
import { useResolveParams } from "@/hooks/useResolveParams";
import {
  cardHeaderButtonProps,
  cardProps,
  cardSectionProps,
  iconProps,
} from "@/styles/common";

import { Accordion, Button, Card, Stack, Text } from "@mantine/core";

import { IconRefresh } from "@tabler/icons-react";

type JuryRatingCardProps = {
  team: Team;
};

const JuryRatingCard = ({ team }: JuryRatingCardProps) => {
  const { policies } = useResolveParams();
  const categories = {
    [JuryRatingCategory.Product]:
      "Feature completeness, quality, innovation, and overall functionality",
    [JuryRatingCategory.Presentation]:
      "Structure, clarity, and overall presentation",
  };
  const { data: teamTechnicalRating, refetch: refetchTechnicalRating } =
    useGetTechnicalTeamRating(team.id, {
      query: {
        enabled: policies?.can_manage_event ?? false,
      },
    });
  const { data: project } = useGetProject(team.project_id ?? "", {
    query: { enabled: !!team.project_id },
  });
  const { event } = useResolveParams();

  return (
    <Stack>
      <TeamDetailsCard team={team} canViewProject={true} horizontal />
      {project && (
        <Accordion variant="contained" radius="md">
          <Accordion.Item value="disclosure">
            <Accordion.Control>
              <Stack gap={0}>
                <Text fw={700}>Project Description</Text>
                <Text c="dimmed">{project.name}</Text>
              </Stack>
            </Accordion.Control>
            <Accordion.Panel>
              <Markdown content={project.content} trusted />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}

      <Card {...cardProps}>
        <CardHeader title="Jury Rating" />
        {Object.entries(categories).map(([category, description]) => (
          <Card.Section key={category} {...cardSectionProps}>
            <JuryRatingInput
              teamId={team.id}
              category={category as JuryRatingCategory}
              description={description}
            />
          </Card.Section>
        ))}
      </Card>

      {teamTechnicalRating && policies?.can_manage_event && event && (
        <Card {...cardProps}>
          <CardHeader
            title="Technical Questions"
            actions={
              <Button
                {...cardHeaderButtonProps}
                leftSection={<IconRefresh {...iconProps} />}
                onClick={() => refetchTechnicalRating()}
              >
                Refresh
              </Button>
            }
          />
          {teamTechnicalRating.length === 0 && (
            <Card.Section {...cardSectionProps}>
              <Text c="dimmed">No technical questions found.</Text>
            </Card.Section>
          )}
          {teamTechnicalRating.map((rating) => (
            <Card.Section key={rating.question.id} {...cardSectionProps}>
              <TechnicalQuestionEntry
                teamId={team.id}
                eventId={event.id}
                mode="grading"
                technicalQuestion={rating.question}
                initialScore={rating.score ?? undefined}
              />
            </Card.Section>
          ))}
        </Card>
      )}
    </Stack>
  );
};

export default JuryRatingCard;
