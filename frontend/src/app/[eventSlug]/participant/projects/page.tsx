"use client";

import { useGetEventRoles, useGetProjects } from "@/api/gen";
import type { Project } from "@/api/gen";
import style from "@/app/markdown-styles.module.css";

import { useEffect, useState } from "react";
import React from "react";
import Markdown from "react-markdown";

import {
  Button,
  Card,
  Container,
  Flex,
  Group,
  Select,
  Stack,
  Text,
  Title,
  TypographyStylesProvider,
} from "@mantine/core";

import { UUID } from "crypto";
import Link from "next/link";
import { useParams } from "next/navigation";
import remarkGfm from "remark-gfm";
import { styleText } from "util";

export default function Page() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const event_id = "fae4d7ff-ee08-4e16-8802-a1b1797145d5";

  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const { data: roles } = useGetEventRoles(event_id);

  const { data: projects } = useGetProjects({ event_id: event_id });

  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  useEffect(() => {
    if (projects) {
      setSelectedProject(projects[0].slug);
    }
  }, [projects]);

  useEffect(() => {
    if (selectedProject) {
      const project = projects?.find((item) => item.slug == selectedProject);
      setCurrentProject(project || null);
    }
  });

  return (
    <Stack>
      <Flex justify={"space-between"} gap={"md"}>
        <Title order={2}>Projects</Title>
        <Group>
          {roles?.includes("Admin") && (
            <>
              <Link
                href={`/${eventSlug}/participant/projects/${currentProject?.slug}`}
              >
                <Button>Edit</Button>
              </Link>
              <Link href={`/${eventSlug}/participant/projects/create`}>
                <Button>Create</Button>
              </Link>
            </>
          )}
          <Select
            data={projects?.map((item) => item.slug) || []}
            value={selectedProject}
            onChange={(value) => setSelectedProject(value)}
          />
        </Group>
      </Flex>
      {currentProject && (
        <Card withBorder>
          <Stack m={"xl"}>
            <Title order={3}>{currentProject.name}</Title>
            <Container unstyled>
              <Markdown>{currentProject.content}</Markdown>
            </Container>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
