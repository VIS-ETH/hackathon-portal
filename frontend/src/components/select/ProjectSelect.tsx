import { useGetProjects } from "@/api/gen";
import { Project } from "@/api/gen/schemas";
import { inputProps } from "@/styles/common";

import { Select, SelectProps } from "@mantine/core";

type ProjectSelectProps = SelectProps & {
  eventId: string;
  projectId?: string;
  setProject: (project: Project | undefined) => void;
};

const ProjectSelect = ({
  eventId,
  projectId,
  setProject,
  ...additionalProps
}: ProjectSelectProps) => {
  const { data: projects = [] } = useGetProjects({
    event_id: eventId,
  });

  return (
    <Select
      {...(inputProps as SelectProps)}
      {...additionalProps}
      data={projects.map((project) => ({
        label: project.name,
        value: project.id,
      }))}
      value={projectId ?? null} // Mantine expects null and not undefined
      onChange={(value) => {
        if (value === null) {
          setProject(undefined);
        } else {
          setProject(projects.find((project) => project.id === value));
        }
      }}
      placeholder={`Select project`}
      searchable
      clearable
    />
  );
};

export default ProjectSelect;
