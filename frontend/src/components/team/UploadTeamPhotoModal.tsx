import Uploader from "../Uploader";

import { useUpdateTeam } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { modalProps } from "@/styles/common";

import { Modal } from "@mantine/core";

import { MIME_TYPES } from "@mantine/dropzone";

type UploadTeamPhotoModalProps = {
  team: Team;
  refetchTeam: () => void;
  opened: boolean;
  onClose: () => void;
};

const UploadTeamPhotoModal = ({
  team,
  refetchTeam,
  opened,
  onClose,
}: UploadTeamPhotoModalProps) => {
  const updateTeamMutation = useUpdateTeam();

  const handleUploaded = async (ids: string[]) => {
    if (ids.length != 1) {
      throw new Error("Expected exactly one uploaded file");
    }

    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      data: {
        photo_id: ids[0],
      },
    });

    refetchTeam();
    onClose();
  };

  return (
    <Modal
      {...modalProps}
      opened={opened}
      onClose={onClose}
      title="Upload Team Photo"
    >
      <Uploader
        eventId={team.event_id}
        usage="TeamPhoto"
        maxSizeMB={10}
        accept={[MIME_TYPES.png, MIME_TYPES.jpeg]}
        onUploaded={handleUploaded}
      />
    </Modal>
  );
};

export default UploadTeamPhotoModal;
