import { useCreateTeamAiApiKey } from "@/api/gen";
import { SecretSubject } from "@/api/gen/schemas";
import {
  badgeProps,
  iconProps,
  inputProps,
  modalProps,
  primaryButtonProps,
  toolbarButtonProps,
} from "@/styles/common";
import { fmtTeamIndex } from "@/utils";

import { useState } from "react";

import {
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
} from "@mantine/core";

import { useDisclosure, useMap } from "@mantine/hooks";

import { IconRobot } from "@tabler/icons-react";

type GenerateAPIKeysProps = {
  teams: SecretSubject[];
  refetch: () => Promise<unknown>;
};

const GenerateAPIKeys = ({ teams, refetch }: GenerateAPIKeysProps) => {
  const [budget, setBudget] = useState<string | number>("");
  const [opened, { open, close }] = useDisclosure(false);
  const [generating, setGenerating] = useState(false);
  const generateKeysMutation = useCreateTeamAiApiKey();
  const teamKeyStatus = useMap<string, string>();

  const createKeyForTeam = async (team: SecretSubject) => {
    try {
      await generateKeysMutation.mutateAsync({
        teamId: team.id,
        data: {
          budget: budget as number,
        },
      });
    } catch {
      teamKeyStatus.set(team.key, "error");
      return;
    }
    teamKeyStatus.set(team.key, "success");
  };

  const handleGenerateKeys = async () => {
    const confirmation = confirm(
      `Are you sure you want to generate AI API keys for ${teams.length} teams with a total budget of $${(budget as number) * teams.length}?\n\nDo this only once, and only after indexing the teams.`,
    );

    if (!confirmation) {
      return;
    }

    setGenerating(true);
    try {
      await Promise.all(teams.map(createKeyForTeam));
      await refetch();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Modal
        {...modalProps}
        opened={opened}
        onClose={close}
        title="AI API Key Generation"
        centered
      >
        <Stack>
          <NumberInput
            {...inputProps}
            size="sm"
            label="Budget per team"
            description={`$${(budget as number) * teams.length} in total for ${teams.length} teams`}
            placeholder="USD"
            prefix="$"
            value={budget}
            onChange={(value) => setBudget(value)}
            min={0}
          />
          <Button
            {...primaryButtonProps}
            onClick={handleGenerateKeys}
            disabled={budget === ""}
            loading={generating}
          >
            Generate AI Keys for Teams
          </Button>

          {teamKeyStatus.size > 0 && (
            <Stack gap="xs">
              {teams
                .filter((team) => teamKeyStatus.has(team.key))
                .map((team) => (
                  <Group key={team.key} justify="space-between" wrap="nowrap">
                    <Text size="sm">
                      {team.index != null && (
                        <Text span inherit ff="monospace" c="dimmed">
                          {fmtTeamIndex(team.index)}{" "}
                        </Text>
                      )}
                      {team.label}
                    </Text>
                    {teamKeyStatus.get(team.key) === "success" ? (
                      <Badge {...badgeProps} color="green" variant="light">
                        Created
                      </Badge>
                    ) : (
                      <Badge {...badgeProps} color="red" variant="light">
                        Failed
                      </Badge>
                    )}
                  </Group>
                ))}
            </Stack>
          )}
        </Stack>
      </Modal>

      <Button
        {...toolbarButtonProps}
        leftSection={<IconRobot {...iconProps} />}
        onClick={open}
      >
        Generate AI Keys
      </Button>
    </>
  );
};

export default GenerateAPIKeys;
