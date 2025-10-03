"use client";

import { useGetProjects } from "@/api/gen";
import PageSkeleton from "@/components/PageSkeleton";
import CreateProjectDrawer from "@/components/project/CreateProjectDrawer";
import ProjectCard from "@/components/project/ProjectCard";
import { useResolveParams } from "@/hooks/useResolveParams";
import { iconProps, secondaryButtonProps } from "@/styles/common";

import { Button, Group, Stack, Title } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconPlus } from "@tabler/icons-react";

const Projects = () => {
  const [opened, handles] = useDisclosure();
  const { event, policies } = useResolveParams();

  const { data: projects, refetch: refetchProjects } = useGetProjects(
    {
      event_id: event?.id ?? "",
    },
    {
      query: { enabled: !!event },
    },
  );

  if (!event || !policies || !projects) {
    return <PageSkeleton />;
  }

  return (
    <>
      <Stack>
        <Group justify="space-between">
          <Title order={2}>Projects</Title>
          {policies.can_manage_project && (
            <Button
              {...secondaryButtonProps}
              leftSection={<IconPlus {...iconProps} />}
              onClick={handles.open}
            >
              Create
            </Button>
          )}
        </Group>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </Stack>
      <CreateProjectDrawer
        eventId={event.id}
        opened={opened}
        onClose={handles.close}
        refetch={refetchProjects}
      />
    </>
  );
};

export default Projects;
