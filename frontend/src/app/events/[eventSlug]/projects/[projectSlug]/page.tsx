"use client";

import { useDeleteProject, useGetProjects } from "@/api/gen";
import MarkdownCard from "@/components/MarkdownCard";
import PageSkeleton from "@/components/PageSkeleton";
import UpdateProjectDrawer from "@/components/project/UpdateProjectDrawer";
import { useResolveParams } from "@/hooks/useResolveParams";
import { iconProps, secondaryButtonProps } from "@/styles/common";

import { Button, Group, Stack, Title } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconPencil, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

const Project = () => {
  const router = useRouter();
  const [opened, handles] = useDisclosure();
  const { event, project, refetchProject, policies } = useResolveParams();
  const { refetch: refetchProjects } = useGetProjects(
    { event_id: event?.id ?? "" },
    {
      query: {
        enabled: !!event,
      },
    },
  );

  const deleteProjectMutation = useDeleteProject();

  if (!event || !project || !policies) {
    return <PageSkeleton />;
  }

  const refetch = () => {
    refetchProject();
    refetchProjects();
  };

  const handleDelete = async () => {
    const confirm = window.confirm(
      `Are you sure you want to delete "${project.name}"?`,
    );

    if (!confirm) {
      return;
    }

    await deleteProjectMutation.mutateAsync({ projectId: project.id });
    refetchProjects();
    router.push(`/events/${event.slug}/projects`);
  };

  return (
    <>
      <Stack>
        <Group justify="space-between">
          <Title order={2}>{project.name}</Title>
          {policies.can_manage_project && (
            <Group gap="xs">
              <Button
                {...secondaryButtonProps}
                leftSection={<IconPencil {...iconProps} />}
                onClick={handles.open}
              >
                Update
              </Button>
              <Button
                {...secondaryButtonProps}
                leftSection={<IconTrash {...iconProps} />}
                color="red"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </Group>
          )}
        </Group>
        <MarkdownCard content={project.content} />
      </Stack>
      <UpdateProjectDrawer
        project={project}
        opened={opened}
        onClose={handles.close}
        refetch={refetch}
      />
    </>
  );
};

export default Project;
