import { useGetTeams } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { inputProps } from "@/styles/common";

import { useMemo } from "react";

import { Select, SelectProps } from "@mantine/core";

type TeamSelectProps = SelectProps & {
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

  const options = useMemo(
    () =>
      (teams ?? []).map((team) => ({
        label: team.name,
        value: team.id,
      })),
    [teams],
  );

  return (
    <Select
      {...(inputProps as SelectProps)}
      comboboxProps={{ keepMounted: false }}
      {...additionalProps}
      data={options}
      value={teamId ?? null} // Mantine expects null and not undefined
      onChange={(value) => {
        if (value === null) {
          setTeam(undefined);
        } else {
          setTeam(teams?.find((team) => team.id === value));
        }
      }}
      placeholder={`Select team`}
      searchable
      clearable
    />
  );
};

export default TeamSelect;
