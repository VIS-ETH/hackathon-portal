import { useUpdateTeamProject } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import ProjectSelect from "@/components/select/ProjectSelect";

import { Table } from "@mantine/core";

type ProjectTdProps = {
  team: Team;
  ro?: boolean;
  refetch?: () => void;
};

const ProjectTd = ({ team, ro, refetch }: ProjectTdProps) => {
  const updateProjectMutation = useUpdateTeamProject();

  const handleUpdate = async (projectId: string | undefined) => {
    await updateProjectMutation.mutateAsync({
      teamId: team.id,
      data: {
        project_id: projectId,
      },
    });

    refetch?.();
  };

  return (
    <Table.Td>
      <ProjectSelect
        eventId={team.event_id}
        projectId={team.project_id ?? undefined}
        setProject={(project) => handleUpdate(project?.id)}
        size="xs"
        readOnly={ro}
      />
    </Table.Td>
  );
};

export default ProjectTd;
