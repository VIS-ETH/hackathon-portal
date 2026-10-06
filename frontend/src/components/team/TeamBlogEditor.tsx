import TeamBlogSection from "./TeamBlogSection";
import TeamBlogSectionEditor, {
  EditableBlogSection,
} from "./TeamBlogSectionEditor";

import { getGetTeamBlogQueryKey, useUpdateTeamBlog } from "@/api/gen";
import {
  Event,
  Team,
  TeamBlog,
  TeamBlogSection as TeamBlogSectionDTO,
} from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  cardProps,
  iconProps,
  largeIconProps,
  primaryButtonProps,
  secondaryButtonProps,
} from "@/styles/common";

import { useState } from "react";

import { Alert, Button, Card, Group, Stack, Tabs, Text } from "@mantine/core";

import {
  IconAlertCircle,
  IconEye,
  IconInfoCircle,
  IconPencil,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { isEqual } from "lodash";
import { v4 as uuidv4 } from "uuid";

type TeamBlogEditorProps = {
  event: Event;
  team: Team;
  /** The latest blog, only used to initialize the editor and to detect concurrent edits. */
  blog: TeamBlog;
  onSaved: () => void;
};

const toEditableSections = (
  sections: TeamBlogSectionDTO[],
): EditableBlogSection[] =>
  sections.map((section) => ({ ...section, key: uuidv4() }));

const toSectionsForUpdate = (sections: TeamBlogSectionDTO[]) =>
  sections.map(({ content, layout, image_id }) => ({
    content,
    layout,
    image_id: image_id ?? null,
  }));

const TeamBlogEditor = ({
  event,
  team,
  blog,
  onSaved,
}: TeamBlogEditorProps) => {
  const [sections, setSections] = useState(() =>
    toEditableSections(blog.sections),
  );
  // The blog the edits are based on, which must not follow refetches of the blog.
  const [base, setBase] = useState(blog);

  useUnsavedChanges(
    !isEqual(toSectionsForUpdate(sections), toSectionsForUpdate(base.sections)),
  );

  // Someone else has saved the blog since the edits were started, so saving would
  // overwrite their changes. An older version can still arrive from a fetch that was
  // started before our own save, which is not a conflict.
  const hasConflict = blog.version > base.version;

  const queryClient = useQueryClient();
  const blogQueryKey = getGetTeamBlogQueryKey(team.id);

  const updateTeamBlogMutation = useUpdateTeamBlog({
    mutation: {
      onSuccess: (savedBlog) => {
        setBase(savedBlog);
        queryClient.setQueryData(blogQueryKey, savedBlog);
        onSaved();
      },
      onError: async (error) => {
        // Fetching the latest version reveals the conflict without touching the edits.
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          await queryClient.refetchQueries({ queryKey: blogQueryKey });
        }
      },
    },
  });

  const imageCount = new Set(
    sections.map((section) => section.image_id).filter(Boolean),
  ).size;

  const contentLength = sections.reduce(
    (sum, section) => sum + [...section.content].length,
    0,
  );

  const exceedsLimits =
    sections.length > event.blog_max_sections ||
    imageCount > event.blog_max_images ||
    contentLength > event.blog_max_characters;

  const handleAdd = () => {
    setSections((prev) => [
      ...prev,
      { key: uuidv4(), content: "", layout: "ImageTop" },
    ]);
  };

  const handleChange = (index: number, section: EditableBlogSection) => {
    setSections((prev) => prev.map((s, i) => (i === index ? section : s)));
  };

  const handleMove = (index: number, offset: number) => {
    setSections((prev) => {
      const next = [...prev];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  };

  const handleDelete = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoadLatest = () => {
    const confirmation = window.confirm(
      "Are you sure you want to load the latest version? All your changes will be lost.",
    );
    if (!confirmation) return;

    setSections(toEditableSections(blog.sections));
    setBase(blog);
  };

  const handleSave = () => {
    updateTeamBlogMutation.mutate({
      teamId: team.id,
      data: {
        version: base.version,
        sections: toSectionsForUpdate(sections),
      },
    });
  };

  const limitsText = (
    <Text size="sm" c={exceedsLimits ? "red" : "dimmed"}>
      {sections.length} / {event.blog_max_sections} sections · {imageCount} /{" "}
      {event.blog_max_images} images · {contentLength} /{" "}
      {event.blog_max_characters} characters
    </Text>
  );

  return (
    <Stack>
      {hasConflict ? (
        <Alert
          icon={<IconAlertCircle {...largeIconProps} />}
          color="yellow"
          radius="md"
          title="Someone else has changed the blog"
        >
          <Stack align="flex-start">
            <Text>
              Saving is disabled so that their changes are not overwritten. Your
              changes are still here: copy what you want to keep, load the
              latest version and apply your changes again.
            </Text>
            <Button
              {...secondaryButtonProps}
              variant="default"
              leftSection={<IconRefresh {...iconProps} />}
              onClick={handleLoadLatest}
            >
              Load Latest Version
            </Button>
          </Stack>
        </Alert>
      ) : (
        <Alert
          icon={<IconInfoCircle {...iconProps} />}
          color="gray"
          radius="md"
        >
          <Text size="sm">
            Saving replaces the whole blog. If someone else saves while you are
            editing, you will be warned and saving is disabled, so that their
            changes are not overwritten. Agree with your team on who edits the
            blog to avoid redoing work.
          </Text>
        </Alert>
      )}

      <Tabs defaultValue="edit">
        <Tabs.List>
          <Tabs.Tab value="edit" leftSection={<IconPencil {...iconProps} />}>
            Edit
          </Tabs.Tab>
          <Tabs.Tab value="preview" leftSection={<IconEye {...iconProps} />}>
            Preview
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="edit" pt="md">
          <Stack>
            {sections.map((section, index) => (
              <TeamBlogSectionEditor
                key={section.key}
                eventId={team.event_id}
                section={section}
                index={index}
                count={sections.length}
                canAddImage={imageCount < event.blog_max_images}
                maxImageSizeMB={event.blog_max_image_size_mb}
                onChange={(s) => handleChange(index, s)}
                onMove={(offset) => handleMove(index, offset)}
                onDelete={() => handleDelete(index)}
              />
            ))}
            <Group>
              <Button
                {...secondaryButtonProps}
                variant="default"
                disabled={sections.length >= event.blog_max_sections}
                leftSection={<IconPlus {...iconProps} />}
                onClick={handleAdd}
              >
                Add Section
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="preview" pt="md">
          <Card {...cardProps}>
            <Stack gap="xl">
              {sections.map((section) => (
                <TeamBlogSection
                  key={section.key}
                  content={section.content}
                  layout={section.layout}
                  imageUrl={section.image_url}
                />
              ))}
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>

      <Group justify="space-between">
        {limitsText}
        <Button
          {...primaryButtonProps}
          disabled={exceedsLimits || hasConflict}
          loading={updateTeamBlogMutation.isPending}
          onClick={handleSave}
        >
          Save
        </Button>
      </Group>
    </Stack>
  );
};

export default TeamBlogEditor;
