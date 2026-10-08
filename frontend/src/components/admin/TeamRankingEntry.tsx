import ScoreDisplay from "../team/ScoreDisplay";
import TeamDetails from "../team/TeamDetails";
import TeamFeedback from "../team/feedback/TeamFeedback";

import { useUpdateTeam } from "@/api/gen";
import { AdminTeam, TeamRanking } from "@/api/gen/schemas";
import { cardSectionProps, iconProps } from "@/styles/common";
import { fmtScore, fmtTeamIndex } from "@/utils";

import { ReactNode, memo, useState } from "react";

import {
  Box,
  Card,
  Checkbox,
  Flex,
  Grid,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";

import { IconAlertTriangle } from "@tabler/icons-react";

const RANK_WIDTH = 24;
// the rank, a gap and the team
const TEAM_WIDTH = 280;
const TOTAL_WIDTH = 64;
const FINALIST_WIDTH = 64;

type RankingColumnsProps = {
  team: ReactNode;
  points: ReactNode;
  finalist: ReactNode;
  // the header has no points column below md
  header?: boolean;
};

// The columns of the header and the rows. Below md a row takes two lines: the team
// and the finalist flag, then the points.
const RankingColumns = ({
  team,
  points,
  finalist,
  header,
}: RankingColumnsProps) => {
  return (
    <Grid gutter={{ base: "xs", md: "md" }} align="center">
      <Grid.Col span={{ base: "auto", md: "content" }} order={1} miw={0}>
        <Box w={{ md: TEAM_WIDTH }}>{team}</Box>
      </Grid.Col>
      <Grid.Col
        span={{ base: 12, md: "auto" }}
        order={{ base: 3, md: 2 }}
        miw={0}
        visibleFrom={header ? "md" : undefined}
      >
        {points}
      </Grid.Col>
      <Grid.Col span="content" order={{ base: 2, md: 3 }}>
        <Flex w={FINALIST_WIDTH} justify="flex-end">
          {finalist}
        </Flex>
      </Grid.Col>
    </Grid>
  );
};

export const TeamRankingHeader = () => {
  const headerTextProps = { size: "sm", fw: 700 } as const;

  return (
    <Card.Section {...cardSectionProps} py="xs">
      <RankingColumns
        header
        team={
          <Group wrap="nowrap">
            <Text {...headerTextProps} w={RANK_WIDTH} ta="right">
              #
            </Text>
            <Text {...headerTextProps}>Team</Text>
          </Group>
        }
        points={
          <Group wrap="nowrap">
            <Text {...headerTextProps} flex={1}>
              Points
            </Text>
            <Text {...headerTextProps} w={TOTAL_WIDTH} ta="right">
              Total
            </Text>
          </Group>
        }
        finalist={<Text {...headerTextProps}>Finalist</Text>}
      />
    </Card.Section>
  );
};

const DETAILS_BG = "var(--mantine-color-default-hover)";

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
  const [expanded, setExpanded] = useState(false);

  const changeFinalist = (newFinalist: boolean) => {
    updateTeamMutation.mutate({
      teamId: entry.team_id,
      data: {
        finalist: newFinalist,
      },
    });
  };

  return (
    <>
      <Card.Section
        {...cardSectionProps}
        py="sm"
        bg={expanded ? DETAILS_BG : undefined}
      >
        <RankingColumns
          team={
            <UnstyledButton
              w="100%"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              <Group wrap="nowrap">
                <Text w={RANK_WIDTH} ta="right" ff="monospace" flex="none">
                  {entry.rank}
                </Text>
                <Group miw={0} gap="xs" wrap="nowrap">
                  <Text ff="monospace" c="dimmed">
                    {fmtTeamIndex(entry.team_index)}
                  </Text>
                  <Text truncate>{entry.team_name}</Text>
                  {!entry.technical.all_answered && (
                    <Tooltip label="Not all technical questions answered">
                      <ThemeIcon
                        variant="transparent"
                        color="yellow"
                        size="sm"
                        role="img"
                        aria-label="Not all technical questions answered"
                      >
                        <IconAlertTriangle {...iconProps} />
                      </ThemeIcon>
                    </Tooltip>
                  )}
                </Group>
              </Group>
            </UnstyledButton>
          }
          points={
            <Group wrap="nowrap">
              <Box flex={1} miw={0}>
                <ScoreDisplay entry={entry} maxTotalPoints={maxTotalPoints} />
              </Box>
              <Text w={TOTAL_WIDTH} ta="right" flex="none">
                {fmtScore(entry.total_points)}
              </Text>
            </Group>
          }
          finalist={
            <Checkbox
              aria-label={`${entry.team_name} is a finalist`}
              checked={team?.finalist ?? false}
              disabled={!team || finalistUpdating}
              onChange={(event) => changeFinalist(event.currentTarget.checked)}
            />
          }
        />
      </Card.Section>
      {expanded && (
        <Card.Section {...cardSectionProps} bg={DETAILS_BG}>
          <Stack>
            {team && <TeamDetails team={team} canViewProject teamPage />}
            <TeamFeedback entry={entry} adminView />
          </Stack>
        </Card.Section>
      )}
    </>
  );
};

export default memo(TeamRankingEntry);
