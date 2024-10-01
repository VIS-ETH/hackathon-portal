"use client";

import { Project, useGetProjectBySlug, useUpdateProject } from "@/api/gen";
import { ProjectEditor } from "@/componentes/ProjectEditor";

import { useEffect, useState } from "react";

import { Button, Flex, Group, Stack, Switch, Text } from "@mantine/core";

import { useParams, useRouter } from "next/navigation";

const Editor = ({ project }: { project: Project }) => {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const patch_query = useUpdateProject(project.id);
  const router = useRouter();

  useEffect(() => {
    if (project) {
      setDescription(project.content);
      setTitle(project.name);
    }
  }, [project]);

  const [preview, setPreview] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState<string>(
    project?.content || "",
  );
  const [title, setTitle] = useState<string>(project?.name || "");

  return (
    <Stack mih={400} gap={"sm"}>
      <Flex justify={"end"} gap={"md"} align={"center"}>
        <Group>
          <Button
            loading={loading}
            onClick={() => {
              if (title.length == 0) {
                alert("Title is required");
                return;
              }
              setLoading(true);
              patch_query.mutate(
                { content: description, name: title },
                {
                  onError: (error) => {
                    setError(error.message);
                    setLoading(false);
                    alert(error.message);
                  },
                  onSuccess: (data) => {
                    setLoading(false);
                    setError(null);
                    router.replace(
                      `/${eventSlug}/participant/projects/${data.slug}`,
                    );
                  },
                },
              );
            }}
          >
            Update
          </Button>
          <Switch
            checked={preview}
            onChange={(event) => setPreview(event.currentTarget.checked)}
            labelPosition="left"
            label="Preview"
          />
        </Group>
      </Flex>
      <Text c={"red"}>{error}</Text>
      <ProjectEditor
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        preview={preview}
      />
    </Stack>
  );
};

export default function Page() {
  const { eventSlug: slug, projectSlug } = useParams<{
    eventSlug: string;
    projectSlug: string;
  }>();
  const event_id = "fae4d7ff-ee08-4e16-8802-a1b1797145d5";
  const { data: project } = useGetProjectBySlug(slug, projectSlug);

  return <>{project && <Editor project={project} />}</>;
}
