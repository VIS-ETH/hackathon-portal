import {
  useGetProjects,
  useGetTeamProjectPreferences,
  useUpdateTeamProjectPreferences,
} from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { highlightedCardProps, inputProps } from "@/styles/common";

import { useEffect, useState } from "react";

import {
  Card,
  Select,
  SelectProps,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { produce } from "immer";

type ProjectPreferencesInputProps = {
  team: Team;
  refetch?: () => void;
};

const ProjectPreferencesInput = ({
  team,
  refetch,
}: ProjectPreferencesInputProps) => {
  const N_PREFERENCES = 3;

  const { data: projects } = useGetProjects({ event_id: team.event_id });
  const { data: remotePPS, refetch: refetchRemotePPS } =
    useGetTeamProjectPreferences(team.id);

  const updatePPSMutation = useUpdateTeamProjectPreferences();

  const [localPPS, setLocalPPS] = useState<(string | undefined)[]>(
    Array(N_PREFERENCES).fill(undefined),
  );

  useEffect(() => {
    if (remotePPS?.length == N_PREFERENCES) {
      setLocalPPS(remotePPS);
    }
  }, [remotePPS]);

  const validatePPS = (pps: (string | undefined)[]) => {
    const wellDefined = pps.every((pp) => pp !== undefined);
    const correctLength = new Set(pps).size === N_PREFERENCES;

    return wellDefined && correctLength;
  };

  const handleSave = async (index: number, value: string) => {
    const newPPS = produce(localPPS, (draft) => {
      draft[index] = value;
    });

    setLocalPPS(newPPS);

    if (!validatePPS(newPPS)) {
      return;
    }

    updatePPSMutation.mutateAsync({
      teamId: team.id,
      data: newPPS.filter((pp) => pp !== undefined),
    });

    refetchRemotePPS();
    refetch?.();
  };

  return (
    <Stack>
      <SimpleGrid cols={{ xs: 1, sm: 3 }}>
        {Array.from({ length: N_PREFERENCES }).map((_, index) => (
          <Card {...highlightedCardProps} key={index} ta="center">
            <>
              <Text>
                {index == 0 ? "Highest Project Priority" : "Project Priority"}
              </Text>
              <Title mt="sm" order={2}>
                {index + 1}
              </Title>
              <Select
                {...(inputProps as SelectProps)}
                mt="md"
                data={projects?.map((project) => ({
                  label: project.name,
                  value: project.id,
                }))}
                value={localPPS[index]}
                onChange={(value) => {
                  if (value) {
                    handleSave(index, value);
                  }
                }}
              />
            </>
          </Card>
        ))}
      </SimpleGrid>
      {remotePPS && !validatePPS(localPPS) && (
        <Text c="red">Please select {N_PREFERENCES} unique projects.</Text>
      )}
    </Stack>
  );
};

export default ProjectPreferencesInput;
