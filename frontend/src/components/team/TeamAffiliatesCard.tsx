import IconTextGroup from "../IconTextGroup";

import { useGetTeamAffiliates } from "@/api/gen";
import { TeamAffiliate, TeamRole } from "@/api/gen/schemas";
import { cardProps, cardSectionProps } from "@/styles/common";

import { ComponentType } from "react";

import { Card, Stack, Text } from "@mantine/core";

import { IconProps, IconUser, IconUserStar } from "@tabler/icons-react";

type AffiliateGroupProps = {
  label: string;
  affiliates: TeamAffiliate[];
  Icon: ComponentType<IconProps>;
};

const AffiliateGroup = ({ label, affiliates, Icon }: AffiliateGroupProps) => (
  <Stack gap="sm">
    <Text c="dimmed" size="sm">
      {label}
    </Text>
    {affiliates.map((affiliate) => (
      <IconTextGroup key={affiliate.id} Icon={Icon}>
        <Text>{affiliate.name}</Text>
      </IconTextGroup>
    ))}
  </Stack>
);

type TeamAffiliatesCardProps = {
  teamId: string;
};

const TeamAffiliatesCard = ({ teamId }: TeamAffiliatesCardProps) => {
  const { data: affiliates = [] } = useGetTeamAffiliates(teamId);

  const members = affiliates.filter((affiliate) =>
    affiliate.roles.includes(TeamRole.Member),
  );

  const mentors = affiliates.filter((affiliate) =>
    affiliate.roles.includes(TeamRole.Mentor),
  );

  const stakeholders = affiliates.filter((affiliate) =>
    affiliate.roles.includes(TeamRole.Stakeholder),
  );

  return (
    <Card {...cardProps}>
      <Card.Section {...cardSectionProps}>
        {members.length ? (
          <AffiliateGroup
            label="Members"
            affiliates={members}
            Icon={IconUser}
          />
        ) : (
          <Text c="dimmed">No members assigned</Text>
        )}
      </Card.Section>
      {(mentors.length > 0 || stakeholders.length > 0) && (
        <Card.Section {...cardSectionProps}>
          <Stack>
            {mentors.length > 0 && (
              <AffiliateGroup
                label="Mentors"
                affiliates={mentors}
                Icon={IconUserStar}
              />
            )}
            {stakeholders.length > 0 && (
              <AffiliateGroup
                label="Stakeholders"
                affiliates={stakeholders}
                Icon={IconUserStar}
              />
            )}
          </Stack>
        </Card.Section>
      )}
    </Card>
  );
};

export default TeamAffiliatesCard;
