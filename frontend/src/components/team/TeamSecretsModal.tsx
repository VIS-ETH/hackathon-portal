import { useGetTeamSecrets } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import SecretsList from "@/components/secrets/SecretsList";
import { modalProps, skeletonProps } from "@/styles/common";

import { Center, Modal, Skeleton, Text } from "@mantine/core";

type TeamSecretsModalProps = {
  team: Team;
  opened: boolean;
  onClose: () => void;
};

const TeamSecretsModal = ({ team, opened, onClose }: TeamSecretsModalProps) => {
  const { data: secrets, isLoading } = useGetTeamSecrets(team.id, {
    query: { enabled: opened },
  });

  return (
    <Modal
      {...modalProps}
      size="lg"
      opened={opened}
      onClose={onClose}
      title="Team Secrets"
    >
      {isLoading ? (
        <Skeleton {...skeletonProps} />
      ) : secrets?.length ? (
        <SecretsList secrets={secrets} />
      ) : (
        <Center>
          <Text c="dimmed">
            No secrets available. Please contact an administrator if you think
            this is an error.
          </Text>
        </Center>
      )}
    </Modal>
  );
};

export default TeamSecretsModal;
