import MarkdownCard from "../MarkdownCard";

import { Project } from "@/api/gen/schemas";

import { Container } from "@mantine/core";

type ProjectSlideProps = {
  project: Project;
};

const ProjectSlide = ({ project }: ProjectSlideProps) => {
  const content = `# ${project.name}\n\n${project.content}`;

  return (
    <Container>
      <MarkdownCard content={content} />
    </Container>
  );
};

export default ProjectSlide;
