import ActionsTd from "./ActionsTd";
import AffiliateTds from "./AffiliateTds";
import CredentialsTd from "./CredentialsTd";
import ExtraScoreTd from "./ExtraScoreTd";
import InfrastructureTds from "./InfrastructureTds";
import MatchingTds from "./MatchingTds";
import NameTd from "./NameTd";
import ProjectTd from "./ProjectTd";
import { TableView } from "./TableView";

import { AdminTeam, Event, TeamRole } from "@/api/gen/schemas";
import { fmtTeamIndex } from "@/utils";

import { Table, Text } from "@mantine/core";

type TeamsTableRowProps = {
  event: Event;
  team: AdminTeam;
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
      {view == TableView.Infra && (
        <InfrastructureTds team={team} refetch={refetch} />
      )}
      {view == TableView.Credentials && (
        <CredentialsTd team={team} refetch={refetch} />
      )}
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
      {view == TableView.Comments && (
        <ExtraScoreTd team={team} refetch={refetch} />
      )}
      {view == TableView.General && <ActionsTd team={team} refetch={refetch} />}
    </Table.Tr>
  );
};

export default TeamsTableRow;
