import BadgeArray from "../BadgeArray";
import EventAffiliateSelect from "../select/EventAffiliateSelect";
import ProjectSelect from "../select/ProjectSelect";

import {
  useDeleteTeam,
  useDeleteTeamRoles,
  useGetProjects,
  useGetTeamAffiliates,
  useGetTeamPassword,
  useGetTeamProjectPreferences,
  usePutTeamRoles,
  useUpdateTeam,
  useUpdateTeamPassword,
  useUpdateTeamProject,
} from "@/api/gen";
import {
  DeleteTeamRolesBody,
  Event,
  PutTeamRolesBody,
  Team,
  TeamRole,
} from "@/api/gen/schemas";
import { iconProps, inputProps, secondaryButtonProps } from "@/styles/common";
import { resizeArray } from "@/utils";

import {
  Button,
  PasswordInput,
  PasswordInputProps,
  Table,
  Text,
  TextInput,
  TextInputProps,
} from "@mantine/core";

import { IconTrash } from "@tabler/icons-react";

type TeamsTableRowProps = {
  event: Event;
  team: Team;
  proposedProjectId?: string;
  refetch?: () => void;
};

const TeamsTableRow = ({
  event,
  team,
  proposedProjectId,
  refetch,
}: TeamsTableRowProps) => {
  const { data: projects = [] } = useGetProjects({
    event_id: event.id,
  });

  const { data: pps } = useGetTeamProjectPreferences(team.id);
  const { data: password, refetch: refetchPassword } = useGetTeamPassword(
    team.id,
  );
  const { data: affiliates = [], refetch: refetchAffiliates } =
    useGetTeamAffiliates(team.id);

  const updateTeamMutation = useUpdateTeam();
  const updateTeamProjectMutation = useUpdateTeamProject();
  const updateTeamPasswordMutation = useUpdateTeamPassword();
  const putTeamRolesMutation = usePutTeamRoles();
  const deleteTeamRolesMutation = useDeleteTeamRoles();
  const deleteTeamMutation = useDeleteTeam();

  const ppsArray = pps?.project_preferences.map((pp) => ({
    id: pp,
    name: projects.find((p) => p.id === pp)?.name ?? "Unknown",
  }));

  const members = affiliates.filter((affiliate) =>
    affiliate.roles.includes(TeamRole.Member),
  );

  const mentors = resizeArray(
    affiliates.filter((affiliate) => affiliate.roles.includes(TeamRole.Mentor)),
    2,
  );

  const handleUpdateMentors = async (
    mentorId: string | undefined,
    index: number,
  ) => {
    const oldMentorIds = mentors
      .map((mentor) => mentor?.id)
      .filter((mentorId) => mentorId) as string[];

    const rawNewMentorIds = mentors.map((mentor, i) => {
      if (i === index) {
        return mentorId;
      }

      return mentor?.id;
    });

    const newMentorIds = Array.from(new Set(rawNewMentorIds)).filter(
      (mentorId) => mentorId,
    ) as string[];

    const deleteBody: DeleteTeamRolesBody = {};

    for (const oldMentorId of oldMentorIds) {
      deleteBody[oldMentorId] = [TeamRole.Mentor];
    }

    await deleteTeamRolesMutation.mutateAsync({
      teamId: team.id,
      data: deleteBody,
    });

    const putBody: PutTeamRolesBody = {};

    for (const newMentorId of newMentorIds) {
      if (newMentorId) {
        putBody[newMentorId] = [TeamRole.Mentor];
      }
    }

    await putTeamRolesMutation.mutateAsync({
      teamId: team.id,
      data: putBody,
    });

    refetchAffiliates();
  };

  const indexTd = (
    <BadgeArray
      data={[
        {
          id: team.id,
          name: String(team.index),
        },
      ]}
    />
  );

  const nameTd = (
    <TextInput
      {...(inputProps as TextInputProps)}
      size="xs"
      value={team.name}
      onChange={async (value) => {
        if (value.target.value === "") {
          return;
        }

        await updateTeamMutation.mutateAsync({
          teamId: team.id,
          data: {
            name: value.target.value,
          },
        });

        refetch?.();
      }}
    />
  );

  const projectTd = (
    <ProjectSelect
      eventId={event.id}
      projectId={team.project_id ?? undefined}
      setProject={(project) => {
        updateTeamProjectMutation.mutate({
          teamId: team.id,
          data: {
            project_id: project?.id,
          },
        });

        refetch?.();
      }}
      size="xs"
    />
  );

  const proposedProjectTd = (
    <Text>
      {projects.find((project) => project.id === proposedProjectId)?.name}
    </Text>
  );

  const passwordTd = (
    <PasswordInput
      {...(inputProps as PasswordInputProps)}
      size="xs"
      placeholder="Unset"
      value={password?.password ?? ""}
      onChange={async (value) => {
        await updateTeamPasswordMutation.mutateAsync({
          teamId: team.id,
          data: {
            password: value.target.value,
          },
        });

        refetchPassword?.();
      }}
    />
  );

  const deleteButton = (
    <Button
      {...secondaryButtonProps}
      leftSection={<IconTrash {...iconProps} />}
      color="red"
      disabled={members.length > 1}
      onClick={async () => {
        const confirmation = window.confirm(
          `Are you sure you want to delete team ${team.name}?`,
        );

        if (!confirmation) {
          return;
        }

        await deleteTeamMutation.mutateAsync({
          teamId: team.id,
        });

        refetch?.();
      }}
    >
      Delete
    </Button>
  );

  return (
    <Table.Tr>
      <Table.Td>{indexTd}</Table.Td>
      <Table.Td>{nameTd}</Table.Td>
      <Table.Td>{projectTd}</Table.Td>
      {proposedProjectId && <Table.Td>{proposedProjectTd}</Table.Td>}
      <Table.Td>
        <BadgeArray data={ppsArray} indexed />
      </Table.Td>
      <Table.Td>{passwordTd}</Table.Td>
      <Table.Td>
        <BadgeArray data={members} />
      </Table.Td>
      {mentors.map((mentor, index) => (
        <Table.Td key={`${mentor?.id} ${index}`}>
          <EventAffiliateSelect
            eventId={event.id}
            affiliateId={mentor?.id}
            setAffiliate={(mentor) => {
              handleUpdateMentors(mentor?.id, index);
            }}
            role={TeamRole.Mentor}
            size="xs"
          />
        </Table.Td>
      ))}
      <Table.Td>{deleteButton}</Table.Td>
    </Table.Tr>
  );
};

export default TeamsTableRow;
