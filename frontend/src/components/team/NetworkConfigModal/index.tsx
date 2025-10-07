import IngressConfigDiagram from "../IngressConfigDiagram";
import GenericIngressControls from "./GenericIngressControls";

import { useUpdateTeam } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { modalProps, primaryButtonProps } from "@/styles/common";

import { useState } from "react";

import { Button, Modal, SimpleGrid, Stack, Text } from "@mantine/core";

import { isEqual } from "lodash";

type NetworkConfigModalProps = {
  team: Team;
  opened: boolean;
  onClose: () => void;
  refetch?: () => void;
};

const NetworkConfigModal = ({
  team,
  opened,
  onClose,
  refetch,
}: NetworkConfigModalProps) => {
  const [localIngressConfig, setLocalIngressConfig] = useState(
    team.ingress_config,
  );

  const updateTeamMutation = useUpdateTeam();

  const handleUpdate = async () => {
    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      data: {
        ingress_config: localIngressConfig,
      },
    });

    refetch?.();
    onClose();
  };

  return (
    <Modal
      {...modalProps}
      size={team.ingress_enabled ? "auto" : undefined}
      opened={opened}
      onClose={onClose}
      title="Network Configuration"
    >
      {team.ingress_enabled ? (
        <SimpleGrid maw={1200} cols={{ base: 1, md: 2 }}>
          {/* TODO: allow for independent scrolling */}
          <Stack>
            <GenericIngressControls
              config={localIngressConfig}
              setConfig={setLocalIngressConfig}
            />
            <Button
              {...primaryButtonProps}
              onClick={handleUpdate}
              disabled={
                isEqual(localIngressConfig, team.ingress_config) ||
                updateTeamMutation.isPending
              }
            >
              Save Changes
            </Button>
          </Stack>
          <IngressConfigDiagram
            team={team}
            currentConfig={localIngressConfig}
          />
        </SimpleGrid>
      ) : (
        <Text c="dimmed">
          Currently, your team ingress is disabled. Please contact an
          administrator if you think this is an error.
        </Text>
      )}
    </Modal>
  );
};

export default NetworkConfigModal;
