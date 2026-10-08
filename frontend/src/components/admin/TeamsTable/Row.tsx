import ActionsTd from "./ActionsTd";
import AffiliateTds from "./AffiliateTds";
import ExtraScoreTd from "./ExtraScoreTd";
import InfrastructureTds from "./InfrastructureTds";
import MatchingTds from "./MatchingTds";
import NameTd from "./NameTd";
import ProjectTd from "./ProjectTd";
import { TableView } from "./TableView";

import { AdminTeam, Event, TeamAffiliate, TeamRole } from "@/api/gen/schemas";
import { fmtTeamIndex } from "@/utils";

import { memo } from "react";

import { Table, Text } from "@mantine/core";

type TeamsTableRowProps = {
  event: Event;
  team: AdminTeam;
  view: TableView;
  refetch?: () => Promise<unknown>;
  affiliates: TeamAffiliate[];
  refetchAffiliates: () => Promise<unknown>;
  projectPreferences: string[];
};

const TeamsTableRow = ({
  event,
  team,
  view,
  refetch,
  affiliates,
  refetchAffiliates,
  projectPreferences,
}: TeamsTableRowProps) => {
  return (
    <Table.Tr>
      <Table.Td>
        <Text size="sm" ff="monospace">
          {fmtTeamIndex(team.index)}
        </Text>
      </Table.Td>
      <NameTd team={team} ro={view !== TableView.General} refetch={refetch} />
      {(view === TableView.Projects ||
        view === TableView.Mentors ||
        view === TableView.Stakeholders) && (
        <ProjectTd
          team={team}
          ro={view !== TableView.Projects}
          refetch={refetch}
        />
      )}
      {view === TableView.Projects && (
        <MatchingTds team={team} projectPreferences={projectPreferences} />
      )}
      {view === TableView.Infra && (
        <InfrastructureTds team={team} refetch={refetch} />
      )}
      {view === TableView.Members && (
        <AffiliateTds
          team={team}
          affiliates={affiliates}
          refetchAffiliates={refetchAffiliates}
          role={TeamRole.Member}
          max={event.max_team_size}
        />
      )}
      {view === TableView.Mentors && (
        <AffiliateTds
          team={team}
          affiliates={affiliates}
          refetchAffiliates={refetchAffiliates}
          role={TeamRole.Mentor}
          max={2}
        />
      )}
      {view === TableView.Stakeholders && (
        <AffiliateTds
          team={team}
          affiliates={affiliates}
          refetchAffiliates={refetchAffiliates}
          role={TeamRole.Stakeholder}
          max={1}
        />
      )}
      {view === TableView.Notes && (
        <ExtraScoreTd team={team} refetch={refetch} />
      )}
      {view === TableView.General && (
        <ActionsTd team={team} refetch={refetch} />
      )}
    </Table.Tr>
  );
};

export default memo(TeamsTableRow);
