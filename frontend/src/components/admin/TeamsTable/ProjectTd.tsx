import { useGetProjects, useUpdateTeam } from "@/api/gen";
import { AdminTeam } from "@/api/gen/schemas";
import ProjectSelect from "@/components/select/ProjectSelect";

import { Table, Text } from "@mantine/core";

import { NIL } from "uuid";

type ProjectTdProps = {
  team: AdminTeam;
  ro?: boolean;
  refetch?: () => Promise<unknown>;
};

const ProjectTd = ({ team, ro, refetch }: ProjectTdProps) => {
  const updateTeamMutation = useUpdateTeam();
  const { data: projects = [] } = useGetProjects({
    event_id: team.event_id,
  });

  const handleUpdate = async (projectId: string | undefined) => {
    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      data: {
        project_id: projectId ?? NIL,
      },
    });

    refetch?.();
  };

  if (ro) {
    const project = projects.find((p) => p.id === team.project_id);
    return (
      <Table.Td>
        {project ? (
          <Text size="sm">{project.name}</Text>
        ) : (
          <Text size="sm" c="dimmed">
            No project
          </Text>
        )}
      </Table.Td>
    );
  }

  return (
    <Table.Td>
      <ProjectSelect
        eventId={team.event_id}
        projectId={team.project_id ?? undefined}
        setProject={(project) => handleUpdate(project?.id)}
        size="xs"
      />
    </Table.Td>
  );
};

export default ProjectTd;
