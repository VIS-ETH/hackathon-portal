import MarkdownCard from "../MarkdownCard";

import { Project } from "@/api/gen/schemas";

import { Container } from "@mantine/core";

type ProjectSlideProps = {
  project: Project;
};

const ProjectSlide = ({ project }: ProjectSlideProps) => {
  return (
    <Container>
      <MarkdownCard content={project.content} />
    </Container>
  );
};

export default ProjectSlide;
