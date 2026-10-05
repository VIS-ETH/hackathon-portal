import Uploader from "../Uploader";
import TeamImage from "./TeamImage";

import { BlogSectionLayout } from "@/api/gen/schemas";
import {
  cardHeaderSectionProps,
  cardHeaderTextProps,
  cardProps,
  cardSectionProps,
  iconProps,
  modalProps,
  secondaryButtonProps,
  segmentedControlProps,
  textareaProps,
} from "@/styles/common";

import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextareaProps,
} from "@mantine/core";

import { MIME_TYPES } from "@mantine/dropzone";
import { useDisclosure } from "@mantine/hooks";

import {
  IconArrowDown,
  IconArrowUp,
  IconPhotoPlus,
  IconTrash,
} from "@tabler/icons-react";

export type EditableBlogSection = {
  key: string;
  content: string;
  layout: BlogSectionLayout;
  image_id?: string | null;
  image_url?: string | null;
};

const layoutOptions: { value: BlogSectionLayout; label: string }[] = [
  { value: "ImageTop", label: "Top" },
  { value: "ImageBottom", label: "Bottom" },
  { value: "ImageLeft", label: "Left" },
  { value: "ImageRight", label: "Right" },
];

type TeamBlogSectionEditorProps = {
  eventId: string;
  section: EditableBlogSection;
  index: number;
  count: number;
  canAddImage: boolean;
  maxImageSizeMB: number;
  onChange: (section: EditableBlogSection) => void;
  onMove: (offset: number) => void;
  onDelete: () => void;
};

const TeamBlogSectionEditor = ({
  eventId,
  section,
  index,
  count,
  canAddImage,
  maxImageSizeMB,
  onChange,
  onMove,
  onDelete,
}: TeamBlogSectionEditorProps) => {
  const [uploadOpened, uploadHandles] = useDisclosure();

  const handleUploaded = (ids: string[], files: File[]) => {
    if (ids.length !== 1 || files.length !== 1) {
      return;
    }

    onChange({
      ...section,
      image_id: ids[0],
      image_url: URL.createObjectURL(files[0]),
    });

    uploadHandles.close();
  };

  return (
    <Card {...cardProps}>
      <Card.Section {...cardHeaderSectionProps}>
        <Group justify="space-between">
          <Text {...cardHeaderTextProps}>Section {index + 1}</Text>
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              aria-label="Move section up"
              disabled={index === 0}
              onClick={() => onMove(-1)}
            >
              <IconArrowUp {...iconProps} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              aria-label="Move section down"
              disabled={index === count - 1}
              onClick={() => onMove(1)}
            >
              <IconArrowDown {...iconProps} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label="Delete section"
              onClick={onDelete}
            >
              <IconTrash {...iconProps} />
            </ActionIcon>
          </Group>
        </Group>
      </Card.Section>
      <Card.Section {...cardSectionProps} withBorder={false}>
        <Stack>
          {section.image_url ? (
            <Stack gap="xs">
              <TeamImage
                url={section.image_url}
                alt="Blog Image"
                height={200}
                fit="contain"
              />
              <Group justify="space-between">
                <Group gap="xs">
                  <Text size="sm">Image position</Text>
                  <SegmentedControl
                    {...segmentedControlProps}
                    data={layoutOptions}
                    value={section.layout}
                    onChange={(value) =>
                      onChange({
                        ...section,
                        layout: value as BlogSectionLayout,
                      })
                    }
                  />
                </Group>
                <Button
                  {...secondaryButtonProps}
                  color="red"
                  variant="subtle"
                  leftSection={<IconTrash {...iconProps} />}
                  onClick={() =>
                    onChange({ ...section, image_id: null, image_url: null })
                  }
                >
                  Remove Image
                </Button>
              </Group>
            </Stack>
          ) : (
            <Group>
              <Button
                {...secondaryButtonProps}
                variant="default"
                disabled={!canAddImage}
                leftSection={<IconPhotoPlus {...iconProps} />}
                onClick={uploadHandles.open}
              >
                Add Image
              </Button>
            </Group>
          )}
          <Textarea
            {...(textareaProps as TextareaProps)}
            value={section.content}
            onChange={(e) =>
              onChange({ ...section, content: e.currentTarget.value })
            }
            placeholder="Write about your design, progress or learnings..."
            description="Supports Markdown. Embedded images and HTML are not rendered."
          />
        </Stack>
      </Card.Section>
      <Modal
        {...modalProps}
        opened={uploadOpened}
        onClose={uploadHandles.close}
        title="Upload Blog Image"
      >
        <Uploader
          eventId={eventId}
          usage="TeamBlogImage"
          maxSizeMB={maxImageSizeMB}
          accept={[MIME_TYPES.png, MIME_TYPES.jpeg]}
          onUploaded={handleUploaded}
        />
      </Modal>
    </Card>
  );
};

export default TeamBlogSectionEditor;
