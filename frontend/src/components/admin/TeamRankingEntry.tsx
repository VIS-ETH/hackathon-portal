import IconTextGroup from "../IconTextGroup";
import ScoreDisplay from "../team/ScoreDisplay";
import TeamImage from "../team/TeamImage";
import TeamFeedback from "../team/feedback/TeamFeedback";

import { useUpdateTeam } from "@/api/gen";
import { AdminTeam, TeamRanking } from "@/api/gen/schemas";
import { cardProps } from "@/styles/common";
import { fmtTeamIndex } from "@/utils";

import { memo, useState } from "react";

import {
  Accordion,
  Box,
  Card,
  Center,
  Grid,
  Group,
  Loader,
  Stack,
  Switch,
  Text,
} from "@mantine/core";

import { IconWorld } from "@tabler/icons-react";
import Link from "next/link";

type TeamRankingEntryProps = {
  entry: TeamRanking;
  maxTotalPoints: number;
  // live team data; undefined if the team was deleted after the snapshot
  team?: AdminTeam;
  onTeamUpdated: () => Promise<unknown>;
};

const TeamRankingEntry = ({
  entry,
  maxTotalPoints,
  team,
  onTeamUpdated,
}: TeamRankingEntryProps) => {
  const updateTeamMutation = useUpdateTeam({
    mutation: { onSuccess: onTeamUpdated },
  });
  const finalistUpdating = updateTeamMutation.isPending;
  // The panel content renders on first open and then stays mounted, so closing still animates.
  const [opened, setOpened] = useState(false);

  const changeFinalist = (newFinalist: boolean) => {
    updateTeamMutation.mutate({
      teamId: entry.team_id,
      data: {
        finalist: newFinalist,
      },
    });
  };

  const teamWebpage = team?.ingress_url && (
    <IconTextGroup Icon={IconWorld}>
      <Link
        href={team.ingress_url}
        passHref
        referrerPolicy="no-referrer"
        target="_blank"
      >
        <Text>{team.ingress_url}</Text>
      </Link>
    </IconTextGroup>
  );

  return (
    <Card {...cardProps}>
      <Card.Section>
        <Accordion
          onChange={(value) => {
            if (value) {
              setOpened(true);
            }
          }}
        >
          <Accordion.Item value="team-info">
            <Group wrap="nowrap" gap={0}>
              <Accordion.Control>
                <Grid justify="center" align="center" py="md">
                  <Grid.Col span={1}>
                    <Center>
                      <Text ff="monospace">{entry.rank}</Text>
                    </Center>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Group>
                      <Text>{entry.team_name}</Text>
                      <Text ff="monospace">
                        {fmtTeamIndex(entry.team_index)}
                      </Text>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <ScoreDisplay
                      entry={entry}
                      maxTotalPoints={maxTotalPoints}
                    />
                    {!entry.technical.all_answered && (
                      <Text c="red">Not all technical questions answered</Text>
                    )}
                  </Grid.Col>
                </Grid>
              </Accordion.Control>
              <Box px="md" style={{ flexShrink: 0 }}>
                <Switch
                  size="md"
                  description="Finalist"
                  checked={team?.finalist ?? false}
                  disabled={!team || finalistUpdating}
                  thumbIcon={
                    finalistUpdating ? (
                      <Loader size={10} color="blue" />
                    ) : undefined
                  }
                  onChange={(event) =>
                    changeFinalist(event.currentTarget.checked)
                  }
                />
              </Box>
            </Group>
            <Accordion.Panel>
              {opened && (
                <Stack>
                  <Group>
                    <TeamImage
                      url={team?.photo_url}
                      width={240}
                      alt={entry.team_name}
                    />
                    {teamWebpage}
                  </Group>
                  <TeamFeedback entry={entry} adminView />
                </Stack>
              )}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Card.Section>
    </Card>
  );
};

export default memo(TeamRankingEntry);
