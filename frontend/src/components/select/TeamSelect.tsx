import EntitySelect from "./EntitySelect";

import { useGetTeams } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { fmtTeamIndex } from "@/utils";

import { useMemo } from "react";

import {
  ComboboxItem,
  Group,
  OptionsFilter,
  SelectProps,
  Text,
} from "@mantine/core";

type TeamSelectProps = Omit<
  SelectProps,
  | "data"
  | "value"
  | "onChange"
  | "placeholder"
  | "searchable"
  | "clearable"
  | "leftSection"
  | "renderOption"
  | "filter"
> & {
  eventId: string;
  teamId?: string;
  setTeam: (team: Team | undefined) => void;
};

const TeamSelect = ({
  eventId,
  teamId,
  setTeam,
  ...additionalProps
}: TeamSelectProps) => {
  const { data: teams } = useGetTeams({
    event_id: eventId,
  });

  // the index is rendered next to the name, in monospace
  const indexById = useMemo(
    () =>
      new Map((teams ?? []).map((team) => [team.id, fmtTeamIndex(team.index)])),
    [teams],
  );
  const teamIndex = (id: string) => (
    <Text span inherit ff="monospace" c="dimmed">
      {indexById.get(id)}
    </Text>
  );

  // matches the index as well as the name
  const filter: OptionsFilter = ({ options, search }) => {
    const query = search.toLowerCase().trim();
    return (options as ComboboxItem[]).filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        indexById.get(option.value)?.includes(query),
    );
  };

  return (
    <EntitySelect
      {...additionalProps}
      entities={teams}
      entityId={teamId}
      setEntity={setTeam}
      leftSection={teamId ? teamIndex(teamId) : undefined}
      renderOption={({ option }) => (
        <Group gap="xs" wrap="nowrap" align="baseline">
          {teamIndex(option.value)}
          {option.label}
        </Group>
      )}
      filter={filter}
      placeholder="Select team"
    />
  );
};

export default TeamSelect;
