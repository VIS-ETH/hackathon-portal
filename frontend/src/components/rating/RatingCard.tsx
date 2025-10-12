import Markdown from "../Markdown";
import TeamDetailsCard from "../team/TeamDetailsCard";
import TechnicalQuestionEntry from "../technicalQuestions/TechnicalQuestionEntry";
import ExpertRatingInput from "./ExpertRating/ExpertRatingInput";

import { useGetProject, useGetTechnicalTeamRating } from "@/api/gen";
import { ExpertRatingCategory, Team } from "@/api/gen/schemas";
import { useResolveParams } from "@/hooks/useResolveParams";
import { cardProps, cardSectionProps } from "@/styles/common";

import { Accordion, Button, Card, Group, Stack, Title } from "@mantine/core";

type ExpertRatingCardProps = {
  team: Team;
};

const ExpertRatingCard = ({ team }: ExpertRatingCardProps) => {
  const { policies } = useResolveParams();
  const categories = {
    [ExpertRatingCategory.Product]:
      "Feature completeness, quality, innovation, and overall functionality",
    [ExpertRatingCategory.Presentation]:
      "Structure, clarity, and overall presentation",
  };
  const { data: teamTechnicalRating, refetch: refetchTechnicalRating } =
    useGetTechnicalTeamRating(team.id, {
      query: {
        enabled: policies?.can_manage_event ?? false,
      },
    });
  const { data: project } = useGetProject(team.project_id ?? "");
  const { event } = useResolveParams();

  return (
    <Card {...cardProps}>
      <Stack gap={"xs"}>
        <Title order={4}>{team.name}</Title>
        <Group justify="center">
          <TeamDetailsCard team={team} canViewProject={true} />
        </Group>
        {project && (
          <>
            <Title order={3}>Project Description</Title>
            <Accordion variant="filled">
              <Accordion.Item value="disclosure">
                <Accordion.Control>{project.name}</Accordion.Control>
                <Accordion.Panel>
                  <Markdown content={project.content} />
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </>
        )}

        <Title order={3}>Expert Rating</Title>
        {Object.entries(categories).map(([category, description]) => (
          <Card.Section key={category} {...cardSectionProps}>
            <ExpertRatingInput
              teamId={team.id}
              category={category as ExpertRatingCategory}
              description={description}
            />
          </Card.Section>
        ))}
        {teamTechnicalRating && policies?.can_manage_event && event && (
          <>
            <Title order={3}>Technical Questions</Title>
            <Stack gap={0}>
              <Group justify="end" w={"100%"} py={"md"}>
                <Button onClick={() => refetchTechnicalRating()}>
                  Refresh
                </Button>
              </Group>
              {teamTechnicalRating.map((rating) => (
                <TechnicalQuestionEntry
                  key={rating.question.id}
                  teamId={team.id}
                  eventId={event.id}
                  mode="grading"
                  q={rating.question}
                  s={rating.points || undefined}
                />
              ))}
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
};

export default ExpertRatingCard;
