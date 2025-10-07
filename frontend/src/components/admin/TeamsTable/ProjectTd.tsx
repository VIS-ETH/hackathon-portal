import { useUpdateTeam } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import ProjectSelect from "@/components/select/ProjectSelect";

import { Table } from "@mantine/core";

import { NIL } from "uuid";

type ProjectTdProps = {
  team: Team;
  ro?: boolean;
  refetch?: () => void;
};

const ProjectTd = ({ team, ro, refetch }: ProjectTdProps) => {
  const updateTeamMutation = useUpdateTeam();

  const handleUpdate = async (projectId: string | undefined) => {
    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      data: {
        project_id: projectId ?? NIL,
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
