import IconTextGroup from "../IconTextGroup";

import { useGetTeamAffiliates } from "@/api/gen";
import { TeamRole } from "@/api/gen/schemas";
import { cardProps, cardSectionProps } from "@/styles/common";

import { Card, CardSection, Stack, Text } from "@mantine/core";

import { IconUser, IconUserStar } from "@tabler/icons-react";

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
      <CardSection {...cardSectionProps} h="100%">
        <Stack gap="sm">
          {members.length ? (
            <>
              <Text c="dimmed" size="sm">
                Members
              </Text>
              {members.map((member) => (
                <IconTextGroup key={member.id} Icon={IconUser}>
                  <Text>{member.name}</Text>
                </IconTextGroup>
              ))}
            </>
          ) : (
            <Text c="dimmed">No members assigned</Text>
          )}
        </Stack>
      </CardSection>
      <CardSection {...cardSectionProps} pt={0}>
        <Stack gap="sm">
          <Text c="dimmed" size="sm">
            Mentors
          </Text>
          {mentors.map((mentor) => (
            <IconTextGroup key={mentor.id} Icon={IconUserStar}>
              <Text>{mentor.name}</Text>
            </IconTextGroup>
          ))}
          {mentors.length === 0 && (
            <Text size="xs" c="dimmed">
              No mentors assigned
            </Text>
          )}
          <Text c="dimmed" size="sm" mt="md">
            Stakeholders
          </Text>
          {stakeholders.map((stakeholder) => (
            <IconTextGroup key={stakeholder.id} Icon={IconUserStar}>
              <Text>{stakeholder.name}</Text>
            </IconTextGroup>
          ))}
          {stakeholders.length === 0 && (
            <Text size="xs" c="dimmed">
              No stakeholders assigned
            </Text>
          )}
        </Stack>
      </CardSection>
    </Card>
  );
};

export default TeamAffiliatesCard;
