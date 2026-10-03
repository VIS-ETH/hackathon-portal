import LinkCard from "../LinkCard";

import { useGetEvent } from "@/api/gen";
import { Project } from "@/api/gen/schemas";

type ProjectCardProps = {
  project: Project;
};

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { data: event } = useGetEvent(project.event_id);

  return (
    <LinkCard
      href={`/events/${event?.slug}/projects/${project.slug}`}
      title={project.name}
    />
  );
};

export default ProjectCard;
