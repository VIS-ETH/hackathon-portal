import AccessDetailsModal from "./AccessDetailsModal";
import NetworkConfigModal from "./NetworkConfigModal";
import UploadTeamPhotoModal from "./UploadTeamPhotoModal";

import { useUpdateTeam } from "@/api/gen";
import { Policies, Team } from "@/api/gen/schemas";
import { iconProps, menuProps, secondaryButtonProps } from "@/styles/common";

import { Button, Menu } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import {
  IconChevronDown,
  IconKey,
  IconNetwork,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { NIL } from "uuid";

type TeamMenuProps = {
  team: Team;
  refetchTeam: () => void;
  policies: Policies;
};

const TeamMenu = ({ team, refetchTeam, policies }: TeamMenuProps) => {
  const [uploadPhotoOpened, uploadPhotoHandles] = useDisclosure();
  const [accessDetailsOpened, accessDetailsHandles] = useDisclosure();
  const [networkConfigOpened, networkConfigHandles] = useDisclosure();
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

  const accessDetailsItem = policies.can_view_team_confidential && (
    <>
      <Menu.Item
        leftSection={<IconKey {...iconProps} />}
        onClick={accessDetailsHandles.open}
      >
        Access Details
      </Menu.Item>
    </>
  );

  const networkConfigItem = policies.can_update_team_ingress_config && (
    <>
      <Menu.Item
        leftSection={<IconNetwork {...iconProps} />}
        onClick={networkConfigHandles.open}
      >
        Network Configuration
      </Menu.Item>
    </>
  );

  const infrastructureSection = (accessDetailsItem || networkConfigItem) && (
    <>
      <Menu.Label>Infrastructure</Menu.Label>
      {accessDetailsItem}
      {networkConfigItem}
    </>
  );

  if (!photoSection && !infrastructureSection) {
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
        <Menu.Dropdown miw={200}>
          {photoSection}
          {infrastructureSection}
        </Menu.Dropdown>
      </Menu>
      <UploadTeamPhotoModal
        team={team}
        refetchTeam={refetchTeam}
        opened={uploadPhotoOpened}
        onClose={uploadPhotoHandles.close}
      />
      <AccessDetailsModal
        team={team}
        opened={accessDetailsOpened}
        onClose={accessDetailsHandles.close}
      />
      <NetworkConfigModal
        team={team}
        opened={networkConfigOpened}
        onClose={networkConfigHandles.close}
        refetch={refetchTeam}
      />
    </>
  );
};

export default TeamMenu;
