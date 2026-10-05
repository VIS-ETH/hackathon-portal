import TeamBlogSection from "./TeamBlogSection";
import TeamBlogSectionEditor, {
  EditableBlogSection,
} from "./TeamBlogSectionEditor";

import { useUpdateTeamBlog } from "@/api/gen";
import {
  Event,
  Team,
  TeamBlogSection as TeamBlogSectionDTO,
} from "@/api/gen/schemas";
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
  IconPencil,
  IconPlus,
} from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";

type TeamBlogEditorProps = {
  event: Event;
  team: Team;
  initialSections: TeamBlogSectionDTO[];
  onSaved: () => void;
};

const TeamBlogEditor = ({
  event,
  team,
  initialSections,
  onSaved,
}: TeamBlogEditorProps) => {
  const [sections, setSections] = useState<EditableBlogSection[]>(() =>
    initialSections.map((section) => ({ ...section, key: uuidv4() })),
  );

  const updateTeamBlogMutation = useUpdateTeamBlog();

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

  const handleSave = async () => {
    await updateTeamBlogMutation.mutateAsync({
      teamId: team.id,
      data: sections.map(({ content, layout, image_id }) => ({
        content,
        layout,
        image_id: image_id ?? null,
      })),
    });

    onSaved();
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
      <Alert
        icon={<IconAlertCircle {...largeIconProps} />}
        color="red"
        radius="md"
        title="RISK OF DATA LOSS!"
      >
        <Text>
          Saving <strong>replaces the whole blog</strong> with the content of
          this editor. If multiple people edit the blog at the same time,{" "}
          <strong>the last one to save overwrites</strong> all changes of the
          others. Coordinate with your team so that only one person edits the
          blog at a time.
        </Text>
      </Alert>

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
          disabled={exceedsLimits}
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
