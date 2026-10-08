import LinkCard from "../LinkCard";

import { Project } from "@/api/gen/schemas";

type ProjectCardProps = {
  eventSlug: string;
  project: Project;
};

const ProjectCard = ({ eventSlug, project }: ProjectCardProps) => {
  return (
    <LinkCard
      href={`/events/${eventSlug}/projects/${project.slug}`}
      title={project.name}
    />
  );
};

export default ProjectCard;
