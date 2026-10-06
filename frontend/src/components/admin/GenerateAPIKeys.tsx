"use client";

import { useCreateTeamAiApiKey } from "@/api/gen";
import { AdminTeam } from "@/api/gen/schemas";

import { useState } from "react";

import { Button, Modal, NumberInput, Text } from "@mantine/core";

import { useDisclosure, useMap } from "@mantine/hooks";

type GenerateAPIKeysProps = {
  teams: AdminTeam[];
  refetch: () => Promise<unknown>;
};

const GenerateAPIKeys = ({ teams, refetch }: GenerateAPIKeysProps) => {
  const [budget, setBudget] = useState<string | number>("");
  const [opened, { open, close }] = useDisclosure(false);
  const generateKeysMutation = useCreateTeamAiApiKey();
  const teamKeyStatus = useMap<number, string>();

  const createKeyForTeam = async (team: AdminTeam) => {
    try {
      await generateKeysMutation.mutateAsync({
        teamId: team.id,
        data: {
          budget: budget as number,
        },
      });
    } catch {
      teamKeyStatus.set(team.index, "error");
      return;
    }
    teamKeyStatus.set(team.index, "success");
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
          teamKeyStatus.entries().map(([teamIndex, status]) => (
            <Text key={teamIndex}>
              team-{teamIndex}: {status}
            </Text>
          ))}
      </Modal>

      <Button onClick={open}>Generate</Button>
    </>
  );
};

export default GenerateAPIKeys;
