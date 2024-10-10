import ActionsTd from "./ActionsTd";
import AffiliateTds from "./AffiliateTds";
import ExtraScoreTd from "./ExtraScoreTd";
import MatchingTds from "./MatchingTds";
import NameTd from "./NameTd";
import PasswordTd from "./PasswordTd";
import ProjectTd from "./ProjectTd";
import { TableView } from "./TableView";

import { Event, Team, TeamRole } from "@/api/gen/schemas";
import { fmtTeamIndex } from "@/utils";

import { Table, Text } from "@mantine/core";

type TeamsTableRowProps = {
  event: Event;
  team: Team;
  view: TableView;
  refetch?: () => void;
};

const TeamsTableRow = ({ event, team, view, refetch }: TeamsTableRowProps) => {
  return (
    <Table.Tr>
      <Table.Td>
        <Text ff="monospace">{fmtTeamIndex(team.index)}</Text>
      </Table.Td>
      <NameTd team={team} ro={view != TableView.General} refetch={refetch} />
      {(view == TableView.Projects || view == TableView.Mentors) && (
        <ProjectTd
          team={team}
          ro={view != TableView.Projects}
          refetch={refetch}
        />
      )}
      {view == TableView.Projects && <MatchingTds team={team} />}
      {view == TableView.Password && <PasswordTd team={team} />}
      {view == TableView.Members && (
        <AffiliateTds
          team={team}
          role={TeamRole.Member}
          max={event.max_team_size}
        />
      )}
      {view == TableView.Mentors && (
        <AffiliateTds team={team} role={TeamRole.Mentor} max={2} />
      )}
      {view == TableView.General && <ActionsTd team={team} refetch={refetch} />}
      {view == TableView.Comments && (
        <ExtraScoreTd team={team} refetch={refetch} />
      )}
    </Table.Tr>
  );
};

export default TeamsTableRow;
