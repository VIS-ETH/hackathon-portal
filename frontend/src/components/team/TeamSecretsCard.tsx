import CardHeader from "../CardHeader";

import { SecretValue } from "@/api/gen/schemas";
import SecretsList from "@/components/secrets/SecretsList";
import { cardProps, cardSectionProps } from "@/styles/common";

import { Card } from "@mantine/core";

type TeamSecretsCardProps = {
  secrets: SecretValue[];
};

const TeamSecretsCard = ({ secrets }: TeamSecretsCardProps) => {
  return (
    <Card {...cardProps}>
      <CardHeader title="Team Secrets" />
      <Card.Section {...cardSectionProps} withBorder={false}>
        <SecretsList secrets={secrets} />
      </Card.Section>
    </Card>
  );
};

export default TeamSecretsCard;
