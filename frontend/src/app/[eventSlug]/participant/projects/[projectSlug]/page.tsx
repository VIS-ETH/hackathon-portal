"use client";

import {
  Project,
  useGetProjectBySlug,
  useGetProjects,
  useUpdateProject,
} from "@/api/gen";
import { ProjectEditor } from "@/componentes/ProjectEditor";
import ProjectNavigator from "@/componentes/ProjectNavigation";

import { useEffect, useState } from "react";
import Markdown from "react-markdown";

import {
  Button,
  Card,
  Container,
  Flex,
  Group,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";

import { useParams, useRouter } from "next/navigation";

export default function Page() {
  const { eventSlug: slug, projectSlug } = useParams<{
    eventSlug: string;
    projectSlug: string;
  }>();
  const event_id = "fae4d7ff-ee08-4e16-8802-a1b1797145d5";
  const { data: all_projects } = useGetProjects({ event_id: event_id });
  const { data: project } = useGetProjectBySlug(slug, projectSlug);

  return (
    <Stack>
      {all_projects && (
        <ProjectNavigator
          projects={all_projects}
          event_id={event_id}
          current_project={project ?? null}
        />
      )}
      {project && (
        <Card withBorder>
          <Stack m={"xl"}>
            {/* <Title order={3}>{project.name}</Title> */}
            <Container unstyled>
              <Markdown>{project.content}</Markdown>
            </Container>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
