import TeamRankingEntry, { TeamRankingHeader } from "./TeamRankingEntry";

import {
  useCreateRankingSnapshot,
  useGetAdminTeams,
  useGetLiveRanking,
  useGetRanking,
  useGetRankingSnapshots,
  useSetCurrentRankingSnapshot,
} from "@/api/gen";
import {
  cardProps,
  cardSectionProps,
  iconProps,
  inputProps,
  skeletonProps,
  toolbarButtonProps,
} from "@/styles/common";

import { useState } from "react";
import { useIntl } from "react-intl";

import {
  Button,
  Card,
  Combobox,
  Group,
  Select,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";

import { IconPlus, IconRefresh } from "@tabler/icons-react";
import { isEqual } from "lodash";

type RankingPanelProps = {
  eventId: string;
};

const LIVE = "live";

const RankingPanel = ({ eventId }: RankingPanelProps) => {
  const intl = useIntl();
  // a snapshot id or LIVE; null means the current snapshot, or the live
  // ranking if there's none
  const [selected, setSelected] = useState<string | null>(null);

  const { data: teams = [], refetch: refetchTeams } = useGetAdminTeams({
    event_id: eventId,
  });
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  const {
    data: snapshots,
    isLoading: snapshotsLoading,
    refetch: refetchSnapshots,
  } = useGetRankingSnapshots(eventId);
  const value = snapshots
    ? (selected ??
      snapshots.find((snapshot) => snapshot.is_current)?.id ??
      LIVE)
    : null;
  const isLive = value === LIVE;
  const selectedSnapshot = snapshots?.find((snapshot) => snapshot.id === value);

  const snapshotQuery = useGetRanking(
    eventId,
    { snapshot_id: selectedSnapshot?.id },
    { query: { enabled: !!selectedSnapshot } },
  );
  const liveQuery = useGetLiveRanking(eventId, {
    query: { enabled: isLive },
  });
  // the snapshots are sorted newest first
  const latestId = snapshots?.[0]?.id;
  const latestQuery = useGetRanking(
    eventId,
    { snapshot_id: latestId },
    { query: { enabled: isLive && !!latestId } },
  );
  const liveChanged =
    !!liveQuery.data &&
    (!latestId ||
      (!!latestQuery.data &&
        !isEqual(liveQuery.data, latestQuery.data.ranking)));

  const createSnapshotMutation = useCreateRankingSnapshot({
    mutation: {
      onSuccess: () => {
        setSelected(null);
        return refetchSnapshots();
      },
    },
  });
  const setCurrentSnapshotMutation = useSetCurrentRankingSnapshot({
    mutation: { onSuccess: () => refetchSnapshots() },
  });

  const createSnapshot = () => {
    const confirmation = confirm(
      "Create a new snapshot from the live ranking? It becomes the current ranking shown to participants and in the presentation.",
    );
    if (!confirmation) {
      return;
    }
    createSnapshotMutation.mutate({ eventId });
  };

  const fmtDate = (date: Date) =>
    intl.formatDate(date, { dateStyle: "medium", timeStyle: "medium" });

  // LIVE and CURRENT are rendered as monospace tags after the date
  const tagText = (id: string | null) =>
    id === LIVE
      ? "LIVE"
      : snapshots?.find((snapshot) => snapshot.id === id)?.is_current
        ? "CURRENT"
        : undefined;
  const tag = (text: string | undefined) =>
    text && (
      <Text span inherit ff="monospace" c="dimmed">
        {text}
      </Text>
    );
  const valueTag = tagText(value);

  const ranking = isLive ? liveQuery.data : snapshotQuery.data?.ranking;
  const isLoading = isLive
    ? liveQuery.isLoading
    : snapshotsLoading || snapshotQuery.isLoading;

  let content;
  if (isLoading) {
    content = (
      <Card.Section {...cardSectionProps}>
        <Stack>
          {Array.from({ length: 11 }, (_, i) => (
            <Skeleton key={i} {...skeletonProps} />
          ))}
        </Stack>
      </Card.Section>
    );
  } else if (ranking) {
    content = (
      <>
        <TeamRankingHeader />
        {ranking.teams.map((entry) => (
          <TeamRankingEntry
            key={entry.team_id}
            entry={entry}
            maxTotalPoints={ranking.max_total_points}
            team={teamsById.get(entry.team_id)}
            onTeamUpdated={refetchTeams}
          />
        ))}
      </>
    );
  }

  return (
    <Card {...cardProps}>
      <Card.Section {...cardSectionProps}>
        <Group>
          <Select
            {...inputProps}
            size="sm"
            w={280}
            allowDeselect={false}
            value={value}
            onChange={setSelected}
            data={[
              {
                value: LIVE,
                // when the live ranking was last fetched
                label: liveQuery.dataUpdatedAt
                  ? fmtDate(new Date(liveQuery.dataUpdatedAt))
                  : "Not fetched yet",
              },
              ...(snapshots ?? []).map((snapshot) => ({
                value: snapshot.id,
                label: fmtDate(new Date(`${snapshot.created_at}Z`)),
              })),
            ]}
            rightSection={
              valueTag && (
                <Group gap="xs" wrap="nowrap">
                  {tag(valueTag)}
                  <Combobox.Chevron />
                </Group>
              )
            }
            rightSectionWidth={valueTag && { LIVE: 80, CURRENT: 104 }[valueTag]}
            rightSectionPointerEvents="none"
            renderOption={({ option }) => (
              <Group gap="xs" wrap="nowrap" justify="space-between" w="100%">
                {option.label}
                {tag(tagText(option.value))}
              </Group>
            )}
          />
          {selectedSnapshot && !selectedSnapshot.is_current && (
            <Button
              {...toolbarButtonProps}
              loading={setCurrentSnapshotMutation.isPending}
              onClick={() =>
                setCurrentSnapshotMutation.mutate({
                  eventId,
                  data: { snapshot_id: selectedSnapshot.id },
                })
              }
            >
              Make Current
            </Button>
          )}
          {isLive && (
            <>
              <Button
                {...toolbarButtonProps}
                leftSection={<IconRefresh {...iconProps} />}
                onClick={() => liveQuery.refetch()}
                loading={liveQuery.isFetching}
              >
                Refresh
              </Button>
              <Button
                {...toolbarButtonProps}
                leftSection={<IconPlus {...iconProps} />}
                onClick={createSnapshot}
                disabled={!liveChanged}
                loading={createSnapshotMutation.isPending}
              >
                Create Snapshot
              </Button>
            </>
          )}
        </Group>
      </Card.Section>
      {content}
    </Card>
  );
};

export default RankingPanel;
