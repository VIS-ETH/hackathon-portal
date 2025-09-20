import UploadTeamPhotoModal from "./UploadTeamPhotoModal";

import { useUpdateTeam } from "@/api/gen";
import { Policies, Team } from "@/api/gen/schemas";
import { iconProps, menuProps, secondaryButtonProps } from "@/styles/common";

import { Button, Menu } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconChevronDown, IconTrash, IconUpload } from "@tabler/icons-react";
import { NIL } from "uuid";

type TeamMenuProps = {
  team: Team;
  refetchTeam: () => void;
  policies: Policies;
};

const TeamMenu = ({ team, refetchTeam, policies }: TeamMenuProps) => {
  const [uploadPhotoOpened, uploadPhotoHandles] = useDisclosure();
  const updateTeamMutation = useUpdateTeam();

  const handleDeletePhoto = async () => {
    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      data: {
        photo_id: NIL,
      },
    });

    refetchTeam();
  };

  const photoSection = policies.can_update_team_photo && (
    <>
      <Menu.Label>Team Photo</Menu.Label>
      <Menu.Item
        leftSection={<IconUpload {...iconProps} />}
        onClick={uploadPhotoHandles.open}
      >
        Upload Photo
      </Menu.Item>
      <Menu.Item
        color="red"
        disabled={!team.photo_url || updateTeamMutation.isPending}
        leftSection={<IconTrash {...iconProps} />}
        onClick={handleDeletePhoto}
      >
        Delete Photo
      </Menu.Item>
    </>
  );

  if (!photoSection) {
    return undefined;
  }

  return (
    <>
      <Menu {...menuProps}>
        <Menu.Target>
          <Button
            {...secondaryButtonProps}
            leftSection={<IconChevronDown {...iconProps} />}
          >
            Administration
          </Button>
        </Menu.Target>
        <Menu.Dropdown miw={200}>{photoSection}</Menu.Dropdown>
      </Menu>
      <UploadTeamPhotoModal
        team={team}
        refetchTeam={refetchTeam}
        opened={uploadPhotoOpened}
        onClose={uploadPhotoHandles.close}
      />
    </>
  );
};

export default TeamMenu;
