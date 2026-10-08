import TeamImage, { TEAM_PHOTO_RATIO } from "./TeamImage";
import UploadTeamPhotoModal from "./UploadTeamPhotoModal";

import { useUpdateTeam } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import {
  iconProps,
  largeIconProps,
  secondaryButtonProps,
} from "@/styles/common";

import {
  AspectRatio,
  Box,
  Button,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconPhotoPlus, IconTrash, IconUpload } from "@tabler/icons-react";
import { NIL } from "uuid";

type EditableTeamPhotoProps = {
  team: Team;
  refetchTeam: () => void;
};

const EditableTeamPhoto = ({ team, refetchTeam }: EditableTeamPhotoProps) => {
  const [uploadOpened, uploadHandles] = useDisclosure();
  const updateTeamMutation = useUpdateTeam();

  const handleDelete = async () => {
    if (!confirm("Delete the team photo? This can't be undone.")) {
      return;
    }

    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      data: { photo_id: NIL },
    });

    refetchTeam();
  };

  return (
    <>
      {team.photo_url ? (
        <Box pos="relative">
          <TeamImage url={team.photo_url} alt="Team Photo" />
          {/* always visible, as touch devices can't hover */}
          <Group gap="xs" pos="absolute" bottom={12} right={12}>
            <Button
              {...secondaryButtonProps}
              variant="default"
              leftSection={<IconUpload {...iconProps} />}
              onClick={uploadHandles.open}
            >
              Replace
            </Button>
            <Button
              {...secondaryButtonProps}
              variant="default"
              c="red"
              leftSection={<IconTrash {...iconProps} />}
              loading={updateTeamMutation.isPending}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Group>
        </Box>
      ) : (
        <AspectRatio ratio={TEAM_PHOTO_RATIO}>
          <UnstyledButton
            onClick={uploadHandles.open}
            bg="var(--mantine-color-default-hover)"
          >
            <Stack align="center" gap="xs" c="dimmed">
              <IconPhotoPlus {...largeIconProps} />
              <Text fw={600}>Add a team photo</Text>
              <Text size="sm">Shown at 4:3, cropped to fit</Text>
            </Stack>
          </UnstyledButton>
        </AspectRatio>
      )}
      <UploadTeamPhotoModal
        team={team}
        refetchTeam={refetchTeam}
        opened={uploadOpened}
        onClose={uploadHandles.close}
      />
    </>
  );
};

export default EditableTeamPhoto;
