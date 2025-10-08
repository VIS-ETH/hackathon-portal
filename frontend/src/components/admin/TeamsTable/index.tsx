import GenerateAPIKeys from "../GenerateAPIKeys";
import TeamsTableRow from "./Row";
import { TableView } from "./TableView";

import { useGetAdminTeams, useIndexTeams } from "@/api/gen";
import { Event } from "@/api/gen/schemas";
import IconTextGroup from "@/components/IconTextGroup";
import NoEntriesTr from "@/components/NoEntriesTr";
import {
  cardProps,
  cardSectionProps,
  iconProps,
  secondaryButtonProps,
  segmentedControlProps,
} from "@/styles/common";

import { useState } from "react";

import {
  Button,
  Card,
  Group,
  SegmentedControl,
  SegmentedControlProps,
  Stack,
  Table,
  Text,
} from "@mantine/core";

import {
  IconAlertTriangle,
  IconListNumbers,
  IconRefresh,
} from "@tabler/icons-react";

type TeamsTableProps = {
  event: Event;
};

const TeamsTable = ({ event }: TeamsTableProps) => {
  const [view, setView] = useState<TableView>("General");

  const { data: teams = [], refetch: refetchTeams } = useGetAdminTeams({
    event_id: event.id,
  });

  const indexTeamsMutation = useIndexTeams();

  const handleIndexTeams = async () => {
    const confirmation = confirm(
      "WARNING - READ THIS: Teams should be indexed at most once per event. The indices are not necessarily stable and the original order is not necessarily preserved. This will cause big confusion for the participants. Are you sure you want to index the teams?",
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
      <Card {...cardProps}>
        <Card.Section {...cardSectionProps}>
          <IconTextGroup
            Icon={IconAlertTriangle}
            iconProps={{ color: "red" }}
            lg
          >
            <Text c="red" fw={600}>
              Unless specified otherwise, all changes are APPLIED IMMEDIATELY.
              <br />
              DO NOT TYPE in the input fields, only paste prepared values.
            </Text>
          </IconTextGroup>
        </Card.Section>
        <Card.Section {...cardSectionProps}>
          <Group>
            <Button
              {...secondaryButtonProps}
              size="sm"
              leftSection={<IconRefresh {...iconProps} />}
              onClick={() => {
                refetchTeams();
              }}
            >
              Refresh
            </Button>
            <Button
              {...secondaryButtonProps}
              size="sm"
              color="red"
              leftSection={<IconListNumbers {...iconProps} />}
              onClick={handleIndexTeams}
            >
              Index Teams
            </Button>

            <SegmentedControl
              {...(segmentedControlProps as SegmentedControlProps)}
              data={Object.values(TableView)}
              value={view}
              onChange={(value) => setView(value as keyof typeof TableView)}
              disabled={teams.length === 0}
            />
          </Group>
        </Card.Section>
        <Card.Section>
          <Table.ScrollContainer minWidth={0}>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th miw={50}>Idx</Table.Th>
                  <Table.Th miw={200}>Name</Table.Th>
                  {(view == TableView.Projects ||
                    view == TableView.Mentors) && (
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
                      <Table.Th miw={200}>Managed Address</Table.Th>
                      <Table.Th miw={200}>Direct Address</Table.Th>
                      <Table.Th miw={200}>Private Address</Table.Th>
                      <Table.Th miw={300}>SSH Config</Table.Th>
                      <Table.Th miw={200}>Ingress Enabled</Table.Th>
                    </>
                  )}
                  {view == TableView.Credentials && (
                    <>
                      <Table.Th miw={200}>VM Password</Table.Th>
                      <Table.Th miw={200}>
                        <Group justify="space-between">
                          <Text>ML Key</Text>
                          <GenerateAPIKeys teams={teams} />
                        </Group>
                      </Table.Th>
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
                  {view == TableView.Comments && (
                    <>
                      <Table.Th>Comment</Table.Th>
                      <Table.Th>Extra Points</Table.Th>{" "}
                    </>
                  )}
                  {view == TableView.General && <Table.Th>Actions</Table.Th>}
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
                    />
                  ))
                ) : (
                  <NoEntriesTr colSpan={3} />
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
