import {
  useGetProjects,
  useGetProjectsMatching,
  useGetTeamProjectPreferences,
} from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { resizeArray } from "@/utils";

import { Table, Text } from "@mantine/core";

type MatchingTdsProps = {
  team: Team;
};

const MatchingTds = ({ team }: MatchingTdsProps) => {
  const { data: matching } = useGetProjectsMatching(team.event_id);
  const { data: pps = [] } = useGetTeamProjectPreferences(team.id);
  const { data: projects = [] } = useGetProjects({
    event_id: team.event_id,
  });

  const matchingId = matching?.[team.id];
  const matchingName =
    projects.find((p) => matchingId && p.id === matchingId)?.name ?? "Unknown";

  const ppsNames = resizeArray(
    pps.map((pp) => projects.find((p) => p.id === pp)?.name ?? "Unknown"),
    3,
  );

  const isConsistent = team.project_id === matchingId && matchingId === pps[0];

  return (
    <>
      <Table.Td>
        <Text size="sm" c={isConsistent ? undefined : "red"}>
          {matchingName}
        </Text>
      </Table.Td>
      {ppsNames.map((name, i) => (
        <Table.Td key={i}>
          <Text size="sm">{name}</Text>
        </Table.Td>
      ))}
    </>
  );
};

export default MatchingTds;
