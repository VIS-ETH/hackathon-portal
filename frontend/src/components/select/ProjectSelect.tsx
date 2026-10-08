import EntitySelect from "./EntitySelect";

import { useGetProjects } from "@/api/gen";
import { Project } from "@/api/gen/schemas";

import { SelectProps } from "@mantine/core";

type ProjectSelectProps = Omit<
  SelectProps,
  "data" | "value" | "onChange" | "placeholder" | "searchable" | "clearable"
> & {
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
  const { data: projects } = useGetProjects({
    event_id: eventId,
  });

  return (
    <EntitySelect
      {...additionalProps}
      entities={projects}
      entityId={projectId}
      setEntity={setProject}
      placeholder="Select project"
    />
  );
};

export default ProjectSelect;
