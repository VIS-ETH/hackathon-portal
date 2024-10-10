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

  return (
    <Card {...cardProps}>
      <CardSection {...cardSectionProps}>
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
      <CardSection {...cardSectionProps}>
        <Stack gap="sm">
          {mentors.length ? (
            <>
              <Text c="dimmed" size="sm">
                Mentors
              </Text>
              {mentors.map((mentor) => (
                <IconTextGroup key={mentor.id} Icon={IconUserStar}>
                  <Text>{mentor.name}</Text>
                </IconTextGroup>
              ))}
            </>
          ) : (
            <Text c="dimmed">No mentors assigned</Text>
          )}
        </Stack>
      </CardSection>
    </Card>
  );
};

export default TeamAffiliatesCard;
