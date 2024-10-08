import {
  useUpdateTeam
} from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import {
  inputProps,
  primaryButtonProps
} from "@/styles/common";

import { useEffect, useState } from "react";

import {
  Button,
  Group,
  Stack,
  TextInput,
  TextInputProps,
  Title
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
    <Stack>
      <Title order={3}>Team Name</Title>
      <Group align="end">
        <TextInput
          {...(inputProps as TextInputProps)}
          value={localName}
          onChange={(event) => setLocalName(event.currentTarget.value)}
          placeholder={team.name}
        />
        <Button
          {...primaryButtonProps}
          onClick={handleSave}
          disabled={localName === team.name || localName === ""}
        >
          Save
        </Button>
      </Group>
    </Stack>
  );
};

export default TeamNameInput;
