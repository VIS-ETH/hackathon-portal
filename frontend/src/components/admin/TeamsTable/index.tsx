import TeamsTableRow from "./Row";
import { TableView } from "./TableView";

import {
  getGetProjectsMatchingQueryKey,
  useGetAdminTeams,
  useGetTeamsAffiliates,
  useGetTeamsProjectPreferences,
  useIndexTeams,
} from "@/api/gen";
import { Event } from "@/api/gen/schemas";
import NoEntriesTr from "@/components/NoEntriesTr";
import { confirmDiscard } from "@/hooks/useUnsavedChanges";
import {
  alertProps,
  cardProps,
  cardSectionProps,
  iconProps,
  largeIconProps,
  segmentedControlProps,
  toolbarButtonProps,
} from "@/styles/common";

import { useState } from "react";

import {
  Alert,
  Button,
  Card,
  Group,
  SegmentedControl,
  Stack,
  Table,
  Text,
} from "@mantine/core";

import {
  IconAlertCircle,
  IconListNumbers,
  IconRefresh,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";

// Shared fallback, so rows without entries get the same array on every render.
const EMPTY: never[] = [];

type TeamsTableProps = {
  event: Event;
};

const TeamsTable = ({ event }: TeamsTableProps) => {
  const [view, setView] = useState<TableView>("General");
  const queryClient = useQueryClient();

  const { data: teams = [], refetch: refetchTeams } = useGetAdminTeams({
    event_id: event.id,
  });

  const showsAffiliates =
    view == TableView.Members ||
    view == TableView.Mentors ||
    view == TableView.Stakeholders;
  const { data: teamsAffiliates, refetch: refetchTeamsAffiliates } =
    useGetTeamsAffiliates(
      { event_id: event.id },
      { query: { enabled: showsAffiliates } },
    );

  const showsProjectPreferences = view == TableView.Projects;
  const {
    data: teamsProjectPreferences,
    refetch: refetchTeamsProjectPreferences,
  } = useGetTeamsProjectPreferences(
    { event_id: event.id },
    { query: { enabled: showsProjectPreferences } },
  );

  const handleRefresh = () => {
    refetchTeams();
    if (showsAffiliates) refetchTeamsAffiliates();
    if (showsProjectPreferences) {
      refetchTeamsProjectPreferences();
      // The matching is fetched per row.
      queryClient.invalidateQueries({
        queryKey: getGetProjectsMatchingQueryKey(event.id),
      });
    }
  };

  // Idx and Name, plus the view's own columns in the header below
  const columnCount =
    2 +
    {
      [TableView.General]: 1,
      [TableView.Projects]: 5,
      [TableView.Infra]: 5,
      [TableView.Members]: event.max_team_size,
      [TableView.Mentors]: 3,
      [TableView.Stakeholders]: 2,
      [TableView.Notes]: 2,
    }[view];

  const indexTeamsMutation = useIndexTeams();

  const handleViewChange = (value: string) => {
    // Switching unmounts the view's fields, which discards their drafts.
    if (value !== view && confirmDiscard()) {
      setView(value as TableView);
    }
  };

  const handleIndexTeams = async () => {
    const confirmation = confirm(
      "Warning: teams should be indexed at most once per event. Indexing again can change the indices and doesn't necessarily keep the original order, which confuses the participants. Are you sure you want to index the teams?",
    );

    if (!confirmation) {
      return;
    }

    await indexTeamsMutation.mutateAsync({
      eventId: event.id,
    });

    refetchTeams();
  };

  return (
    <Stack>
      <Alert
        {...alertProps}
        icon={<IconAlertCircle {...largeIconProps} />}
        color="red"
        title="Team changes apply immediately"
      >
        <Text>
          Selects and checkboxes save right away. Text and number fields save
          when you leave them, and single-line text fields also on{" "}
          <strong>Enter</strong>. Closing or reloading the page with an unsaved
          edit asks first. <strong>Index Teams</strong> and{" "}
          <strong>Delete</strong> ask for confirmation.
        </Text>
      </Alert>
      <Group>
        <SegmentedControl
          {...segmentedControlProps}
          data={Object.values(TableView)}
          value={view}
          onChange={handleViewChange}
          disabled={teams.length === 0}
        />
      </Group>
      <Card {...cardProps}>
        <Card.Section {...cardSectionProps}>
          <Group>
            <Button
              {...toolbarButtonProps}
              leftSection={<IconRefresh {...iconProps} />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            {view === TableView.General && (
              <Button
                {...toolbarButtonProps}
                color="red"
                leftSection={<IconListNumbers {...iconProps} />}
                onClick={handleIndexTeams}
              >
                Index Teams
              </Button>
            )}
          </Group>
        </Card.Section>
        <Card.Section>
          <Table.ScrollContainer minWidth={0}>
            <Table striped horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={60} miw={60}>
                    Idx
                  </Table.Th>
                  <Table.Th miw={200}>Name</Table.Th>
                  {(view == TableView.Projects ||
                    view == TableView.Mentors ||
                    view == TableView.Stakeholders) && (
                    <Table.Th miw={200}>Project</Table.Th>
                  )}
                  {view == TableView.Projects && (
                    <>
                      <Table.Th miw={200}>Matching</Table.Th>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Table.Th key={i} miw={200}>
                          Preference&nbsp;{i + 1}
                        </Table.Th>
                      ))}
                    </>
                  )}
                  {view == TableView.Infra && (
                    <>
                      <Table.Th w={80}>Ingress</Table.Th>
                      <Table.Th miw={250}>Managed Address</Table.Th>
                      <Table.Th miw={250}>Direct Address</Table.Th>
                      <Table.Th miw={250}>Private Address</Table.Th>
                      <Table.Th miw={300}>SSH Config</Table.Th>
                    </>
                  )}
                  {view == TableView.Members &&
                    Array.from({ length: event.max_team_size }).map((_, i) => (
                      <Table.Th key={i} miw={200}>
                        Member&nbsp;{i + 1}
                      </Table.Th>
                    ))}
                  {view == TableView.Mentors &&
                    Array.from({ length: 2 }).map((_, i) => (
                      <Table.Th key={i} miw={200}>
                        Mentor&nbsp;{i + 1}
                      </Table.Th>
                    ))}
                  {view == TableView.Stakeholders &&
                    Array.from({ length: 1 }).map((_, i) => (
                      <Table.Th key={i} miw={200}>
                        Stakeholder&nbsp;{i + 1}
                      </Table.Th>
                    ))}

                  {view == TableView.Notes && (
                    <>
                      <Table.Th miw={300}>Comment</Table.Th>
                      <Table.Th w={150}>Extra Points</Table.Th>
                    </>
                  )}
                  {view == TableView.General && (
                    <Table.Th w={1}>Actions</Table.Th>
                  )}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {teams.length ? (
                  teams.map((team) => (
                    <TeamsTableRow
                      key={team.id}
                      event={event}
                      team={team}
                      view={view}
                      refetch={refetchTeams}
                      affiliates={teamsAffiliates?.[team.id] ?? EMPTY}
                      refetchAffiliates={refetchTeamsAffiliates}
                      projectPreferences={
                        teamsProjectPreferences?.[team.id] ?? EMPTY
                      }
                    />
                  ))
                ) : (
                  <NoEntriesTr colSpan={columnCount} />
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card.Section>
      </Card>
    </Stack>
  );
};

export default TeamsTable;
