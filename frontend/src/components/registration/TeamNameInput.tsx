import { useUpdateTeam } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import {
  cardHeaderSectionProps,
  cardHeaderTextProps,
  cardProps,
  cardSectionProps,
  inputProps,
  primaryButtonProps,
} from "@/styles/common";

import { useEffect, useState } from "react";

import {
  Button,
  Card,
  Group,
  Text,
  TextInput,
  TextInputProps,
} from "@mantine/core";

type TeamNameInputProps = {
  team: Team;
  refetch?: () => void;
};

const TeamNameInput = ({ team, refetch }: TeamNameInputProps) => {
  const [localName, setLocalName] = useState("");

  const updateTeamMutation = useUpdateTeam();

  useEffect(() => {
    setLocalName(team.name);
  }, [team]);

  const handleSave = async () => {
    const newName = localName.trim();

    if (newName === team.name || newName === "") {
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
      <Card.Section {...cardHeaderSectionProps}>
        <Text {...cardHeaderTextProps}>Team Name</Text>
      </Card.Section>
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
            disabled={localName === team.name || localName === ""}
          >
            Update
          </Button>
        </Group>
      </Card.Section>
    </Card>
  );
};

export default TeamNameInput;
