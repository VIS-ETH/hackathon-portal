"use client";

import { useCreateProject } from "@/api/gen";
import { ProjectEditor } from "@/componentes/ProjectEditor";

import { useState } from "react";

import { Button, Flex, Group, Stack, Switch, Text, Title } from "@mantine/core";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";

export default function Page() {
  const { eventSlug: slug } = useParams<{ eventSlug: string }>();
  const event_id = "fae4d7ff-ee08-4e16-8802-a1b1797145d5";
  const post_query = useCreateProject();
  // const patch_query = useUpdateProject(project_id);

  const [preview, setPreview] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState<string>("");
  const [title, setTitle] = useState<string>("");

  return (
    <Stack mih={400}>
      <Flex justify={"space-between"} gap={"md"} align={"center"}>
        <Title order={2}>Create Project</Title>
        <Group>
          <Link href={`/${event_id}/participant/projects`}>
            <Button>Cancel</Button>
          </Link>
          <Button
            loading={loading}
            onClick={() => {
              if (title.length == 0) {
                alert("Title is required");
                return;
              }
              setLoading(true);
              post_query.mutate(
                { event_id: event_id, content: description, name: title },
                {
                  onError: (error) => {
                    setError(error.message);
                    setLoading(false);
                    alert(error.message);
                  },
                  onSuccess: (data) => {
                    setLoading(false);
                    setError(null);
                    setDescription("");
                    setTitle("");
                    alert("Project created");
                  },
                },
              );
            }}
          >
            Create
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
}
