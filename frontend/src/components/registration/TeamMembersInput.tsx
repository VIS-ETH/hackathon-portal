import EventAffiliateSelect from "../select/EventAffiliateSelect";

import {
  useDeleteTeam,
  useDeleteTeamRoles,
  useGetTeamAffiliates,
  usePutTeamRoles,
} from "@/api/gen";
import { EventAffiliate, EventRole, Team, TeamRole } from "@/api/gen/schemas";
import { cardProps, iconProps, secondaryButtonProps } from "@/styles/common";

import { useState } from "react";

import { Button, Card, Group, Stack, Text, Title } from "@mantine/core";

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
    <Stack>
      <Title order={3}>Team Members</Title>
      <Card {...cardProps} style={{ borderStyle: "dashed" }}>
        <Group justify="space-between">
          <EventAffiliateSelect
            eventId={team.event_id}
            role={EventRole.Participant}
            affiliateId={selectedParticipant?.id}
            setAffiliate={setSelectedParticipant}
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
      </Card>
      {members.map((member) => (
        <Card key={member.id} {...cardProps}>
          <Group justify="space-between">
            <Text fw={600}>{member.name}</Text>
            <Button
              {...secondaryButtonProps}
              leftSection={<IconX {...iconProps} />}
              color="red"
              onClick={() => handleRemove(member.id)}
            >
              Remove
            </Button>
          </Group>
        </Card>
      ))}
    </Stack>
  );
};

export default TeamMembersInput;
