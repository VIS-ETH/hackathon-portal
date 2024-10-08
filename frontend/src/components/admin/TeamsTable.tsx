import IconTextGroup from "../IconTextGroup";
import NoEntriesTr from "../NoEntriesTr";
import TeamsTableRow from "./TeamsTableRow";

import { useGetProjectsMatching, useGetTeams, useIndexTeams } from "@/api/gen";
import { Event } from "@/api/gen/schemas";
import {
  cardProps,
  cardSectionProps,
  iconProps,
  secondaryButtonProps,
} from "@/styles/common";

import { useState } from "react";

import { Button, Card, Group, Stack, Table, Text } from "@mantine/core";

import {
  IconAlertTriangle,
  IconLine,
  IconListNumbers,
  IconRefresh,
} from "@tabler/icons-react";

type TeamsTableProps = {
  event: Event;
};

const TeamsTable = ({ event }: TeamsTableProps) => {
  const [getMatchingEnabled, setGetMatchingEnabled] = useState(false);

  const { data: teams = [], refetch: refetchTeams } = useGetTeams({
    event_id: event.id,
  });

  const { data: projectsMatching, refetch: refetchProjectsMatching } =
    useGetProjectsMatching(event.id, {
      query: {
        enabled: getMatchingEnabled,
      },
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
              leftSection={<IconRefresh {...iconProps} />}
              onClick={() => {
                refetchTeams();
              }}
            >
              Refresh
            </Button>
            <Button
              {...secondaryButtonProps}
              leftSection={<IconLine {...iconProps} />}
              onClick={() => {
                refetchProjectsMatching();
                setGetMatchingEnabled(true);
              }}
            >
              Generate Matching
            </Button>
            <Button
              {...secondaryButtonProps}
              color="red"
              leftSection={<IconListNumbers {...iconProps} />}
              onClick={handleIndexTeams}
            >
              Index Teams
            </Button>
          </Group>
        </Card.Section>
        <Card.Section>
          <Table.ScrollContainer minWidth={1500}>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Idx</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Project</Table.Th>
                  {projectsMatching && <Table.Th>Matching</Table.Th>}
                  <Table.Th>Preferences</Table.Th>
                  <Table.Th miw={150}>Password</Table.Th>
                  <Table.Th>Members</Table.Th>
                  <Table.Th>Mentor&nbsp;1</Table.Th>
                  <Table.Th>Mentor&nbsp;2</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {teams.length ? (
                  teams.map((team) => (
                    <TeamsTableRow
                      key={team.id}
                      event={event}
                      team={team}
                      proposedProjectId={projectsMatching?.[team.id]}
                      refetch={refetchTeams}
                    />
                  ))
                ) : (
                  <NoEntriesTr colSpan={9} />
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
