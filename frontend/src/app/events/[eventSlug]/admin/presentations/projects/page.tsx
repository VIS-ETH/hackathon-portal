"use client";

import { useGetProjects } from "@/api/gen";
import { Project } from "@/api/gen/schemas";
import PageLoader from "@/components/PageLoader";
import Presentation from "@/components/admin/Presentation";
import ProjectSlide from "@/components/project/ProjectSlide";
import { useResolveParams } from "@/hooks/useResolveParams";

const Projects = () => {
  const { event } = useResolveParams();
  const { data: projects } = useGetProjects(
    {
      event_id: event?.id ?? "",
    },
    {
      query: {
        enabled: !!event,
      },
    },
  );

  if (!event || !projects) {
    return <PageLoader />;
  }

  const toKey = (project: Project) => project.id;
  const toTitle = (project: Project) => project.name;
  const toContent = (project: Project) => <ProjectSlide project={project} />;

  return (
    <Presentation
      elements={projects}
      toKey={toKey}
      toTitle={toTitle}
      toContent={toContent}
      background
    />
  );
};

export default Projects;
