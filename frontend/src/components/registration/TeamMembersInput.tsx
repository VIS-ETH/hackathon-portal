import EventAffiliateSelect from "../select/EventAffiliateSelect";

import {
  useDeleteTeam,
  useDeleteTeamRoles,
  useGetTeamAffiliates,
  usePutTeamRoles,
} from "@/api/gen";
import { EventAffiliate, EventRole, Team, TeamRole } from "@/api/gen/schemas";
import {
  cardHeaderSectionProps,
  cardHeaderTextProps,
  cardProps,
  cardSectionProps,
  iconProps,
  secondaryButtonProps,
} from "@/styles/common";

import { useState } from "react";

import { Button, Card, Group, Text } from "@mantine/core";

import { IconPlus, IconX } from "@tabler/icons-react";

type TeamMembersInputProps = {
  team: Team;
  refetch?: () => void;
};

const TeamMembersInput = ({ team, refetch }: TeamMembersInputProps) => {
  const [selectedParticipant, setSelectedParticipant] = useState<
    EventAffiliate | undefined
  >();

  const { data: members = [], refetch: refetchMembers } = useGetTeamAffiliates(
    team.id,
    {
      role: TeamRole.Member,
    },
  );

  const putTeamRolesMutation = usePutTeamRoles();
  const deleteTeamRolesMutation = useDeleteTeamRoles();
  const deleteTeamMutation = useDeleteTeam();

  const handleAdd = async () => {
    const userId = selectedParticipant?.id;

    if (!userId) {
      return;
    }

    await putTeamRolesMutation.mutateAsync({
      teamId: team.id,
      data: {
        [userId]: [TeamRole.Member],
      },
    });

    setSelectedParticipant(undefined);
    refetchMembers();
    refetch?.();
  };

  const handleRemove = async (userId: string) => {
    if (members?.length === 1) {
      await deleteTeamMutation.mutateAsync({
        teamId: team.id,
      });
    } else {
      await deleteTeamRolesMutation.mutateAsync({
        teamId: team.id,
        data: {
          [userId]: [TeamRole.Member],
        },
      });
    }

    refetchMembers();
    refetch?.();
  };

  return (
    <Card {...cardProps}>
      <Card.Section {...cardHeaderSectionProps}>
        <Text {...cardHeaderTextProps}>Team Members</Text>
      </Card.Section>
      <Card.Section {...cardSectionProps}>
        <Group justify="space-between">
          <EventAffiliateSelect
            eventId={team.event_id}
            role={EventRole.Participant}
            affiliateId={selectedParticipant?.id}
            setAffiliate={setSelectedParticipant}
            flex={1}
          />
          <Button
            {...secondaryButtonProps}
            leftSection={<IconPlus {...iconProps} />}
            disabled={!selectedParticipant}
            onClick={handleAdd}
          >
            Add
          </Button>
        </Group>
      </Card.Section>
      {members.map((member) => (
        <Card.Section key={member.id} {...cardSectionProps}>
          <Group ms="xs" justify="space-between">
            <Text>{member.name}</Text>
            <Button
              {...secondaryButtonProps}
              leftSection={<IconX {...iconProps} />}
              color="red"
              onClick={() => handleRemove(member.id)}
            >
              Remove
            </Button>
          </Group>
        </Card.Section>
      ))}
    </Card>
  );
};

export default TeamMembersInput;
