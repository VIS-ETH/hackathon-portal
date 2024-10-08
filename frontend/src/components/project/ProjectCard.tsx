import { useGetEvent } from "@/api/gen";
import { Project } from "@/api/gen/schemas";
import { cardProps, iconProps } from "@/styles/common";

import { Card, Group, Text } from "@mantine/core";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";

type ProjectCardProps = {
  project: Project;
};

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { data: event } = useGetEvent(project.event_id);

  return (
    <Link href={`/events/${event?.slug}/projects/${project.slug}`}>
      <Card {...cardProps}>
        <Group justify="space-between">
          <Text fw={600}>{project.name}</Text>
          <IconChevronRight {...iconProps} />
        </Group>
      </Card>
    </Link>
  );
};

export default ProjectCard;
