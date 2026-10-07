import CardHeader from "../CardHeader";

import { useUpdateTeam } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  cardProps,
  cardSectionProps,
  inputProps,
  primaryButtonProps,
} from "@/styles/common";

import { useState } from "react";

import { Button, Card, Group, TextInput, TextInputProps } from "@mantine/core";

type TeamNameInputProps = {
  team: Team;
  refetch?: () => void;
};

const TeamNameInput = ({ team, refetch }: TeamNameInputProps) => {
  const [localName, setLocalName] = useState(team.name);
  const [prevTeam, setPrevTeam] = useState(team);

  const updateTeamMutation = useUpdateTeam();

  if (team !== prevTeam) {
    setPrevTeam(team);
    setLocalName(team.name);
  }

  const newName = localName.trim();
  const canSave = newName !== team.name && newName !== "";

  useUnsavedChanges(canSave);

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      data: {
        name: newName,
      },
    });

    refetch?.();
  };

  return (
    <Card {...cardProps}>
      <CardHeader title="Team Name" />
      <Card.Section {...cardSectionProps}>
        <Group align="center">
          <TextInput
            {...(inputProps as TextInputProps)}
            value={localName}
            onChange={(event) => setLocalName(event.currentTarget.value)}
            placeholder={team.name}
            flex={1}
          />
          <Button
            {...primaryButtonProps}
            onClick={handleSave}
            disabled={!canSave}
          >
            Update
          </Button>
        </Group>
      </Card.Section>
    </Card>
  );
};

export default TeamNameInput;
