"use client";

import { useCreateTeamAiApiKey } from "@/api/gen";
import { SecretSubject } from "@/api/gen/schemas";
import { iconProps, secondaryButtonProps } from "@/styles/common";

import { useState } from "react";

import { Button, Modal, NumberInput, Text } from "@mantine/core";

import { useDisclosure, useMap } from "@mantine/hooks";

import { IconRobot } from "@tabler/icons-react";

type GenerateAPIKeysProps = {
  teams: SecretSubject[];
  refetch: () => Promise<unknown>;
};

const GenerateAPIKeys = ({ teams, refetch }: GenerateAPIKeysProps) => {
  const [budget, setBudget] = useState<string | number>("");
  const [opened, { open, close }] = useDisclosure(false);
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
      `Are you sure you want to generate AI API keys for ${teams.length} teams with a total budget of $${(budget as number) * teams.length}? \nThis should only be DONE ONCE and only AFTER indexing the teams.`,
    );

    if (!confirmation) {
      return;
    }

    await Promise.all(teams.map(createKeyForTeam));
    await refetch();
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title="AI API Key Generation"
        centered
      >
        <NumberInput
          label="Budget"
          placeholder="USD"
          prefix="$"
          value={budget}
          onChange={(value) => setBudget(value)}
          min={0}
        />
        <Text>
          Maximal total expenses {(budget as number) * teams.length} USD
        </Text>
        <Button
          mt="md"
          w="100%"
          onClick={handleGenerateKeys}
          disabled={budget === ""}
        >
          Generate AI Keys for Teams{" "}
        </Button>

        {teamKeyStatus.size > 0 &&
          teamKeyStatus.entries().map(([teamKey, status]) => (
            <Text key={teamKey}>
              {teamKey}: {status}
            </Text>
          ))}
      </Modal>

      <Button
        {...secondaryButtonProps}
        size="sm"
        leftSection={<IconRobot {...iconProps} />}
        onClick={open}
      >
        Generate AI Keys
      </Button>
    </>
  );
};

export default GenerateAPIKeys;
