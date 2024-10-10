import Markdown from "../Markdown";
import ExpertRatingFeedback from "./ExpertRating/ExpertRatingFeedback";
import ExpertRatingInput from "./ExpertRating/ExpertRatingInput";

import { ExpertRatingCategory, Project } from "@/api/gen/schemas";
import { cardProps, cardSectionProps } from "@/styles/common";

import { Accordion, Card } from "@mantine/core";

type ExpertRatingCardProps = {
  teamId: string;
  project?: Project;
  feedbackOnly?: boolean;
};

const ExpertRatingCard = ({
  project,
  teamId,
  feedbackOnly,
}: ExpertRatingCardProps) => {
  const categories = {
    [ExpertRatingCategory.Functionality]:
      "Feature completeness, quality, and overall functionality",
    [ExpertRatingCategory.Ux]: "User experience, ease of use, and design",
    [ExpertRatingCategory.Presentation]:
      "Structure, clarity, and overall presentation",
  };

  const GenericExpertRating = feedbackOnly
    ? ExpertRatingFeedback
    : ExpertRatingInput;

  return (
    <Card {...cardProps}>
      {Object.entries(categories).map(([category, description]) => (
        <Card.Section key={category} {...cardSectionProps}>
          <GenericExpertRating
            teamId={teamId}
            category={category as ExpertRatingCategory}
            description={description}
          />
        </Card.Section>
      ))}
      {project && !feedbackOnly && (
        <Card.Section>
          <Accordion variant="filled">
            <Accordion.Item value="disclosure">
              <Accordion.Control>{project.name}</Accordion.Control>
              <Accordion.Panel>
                <Markdown content={project.content} />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Card.Section>
      )}
    </Card>
  );
};

export default ExpertRatingCard;
