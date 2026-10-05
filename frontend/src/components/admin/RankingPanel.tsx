import TeamRankingEntry from "./TeamRankingEntry";

import {
  useCreateRankingSnapshot,
  useGetAdminTeams,
  useGetLiveRanking,
  useGetRanking,
  useGetRankingSnapshots,
  useSetCurrentRankingSnapshot,
} from "@/api/gen";
import {
  inputProps,
  secondaryButtonProps,
  segmentedControlProps,
} from "@/styles/common";

import { useState } from "react";
import { useIntl } from "react-intl";

import {
  Button,
  Group,
  SegmentedControl,
  Select,
  SelectProps,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";

type RankingPanelProps = {
  eventId: string;
};

type Mode = "Snapshot" | "Live";

const RankingPanel = ({ eventId }: RankingPanelProps) => {
  const intl = useIntl();
  const [mode, setMode] = useState<Mode>("Snapshot");
  // null means "the current snapshot"
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: teams = [], refetch: refetchTeams } = useGetAdminTeams({
    event_id: eventId,
  });
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  const {
    data: snapshots,
    isLoading: snapshotsLoading,
    refetch: refetchSnapshots,
  } = useGetRankingSnapshots(eventId, {
    query: { enabled: mode === "Snapshot" },
  });
  const snapshotId =
    selectedId ?? snapshots?.find((snapshot) => snapshot.is_current)?.id;
  const selectedSnapshot = snapshots?.find(
    (snapshot) => snapshot.id === snapshotId,
  );

  const snapshotQuery = useGetRanking(
    eventId,
    { snapshot_id: snapshotId },
    { query: { enabled: mode === "Snapshot" && !!snapshotId } },
  );
  const liveQuery = useGetLiveRanking(eventId, {
    query: { enabled: mode === "Live" },
  });

  const createSnapshotMutation = useCreateRankingSnapshot({
    mutation: {
      onSuccess: () => {
        setSelectedId(null);
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

  const fmtSnapshot = (createdAt: string, isCurrent: boolean) =>
    intl.formatDate(new Date(`${createdAt}Z`), {
      dateStyle: "medium",
      timeStyle: "medium",
    }) + (isCurrent ? " (current)" : "");

  const controls =
    mode === "Snapshot" ? (
      <Group>
        {snapshots && snapshots.length > 0 && (
          <Select
            {...(inputProps as SelectProps)}
            size="xs"
            w={280}
            allowDeselect={false}
            value={snapshotId ?? null}
            onChange={setSelectedId}
            data={snapshots.map((snapshot) => ({
              value: snapshot.id,
              label: fmtSnapshot(snapshot.created_at, snapshot.is_current),
            }))}
          />
        )}
        {selectedSnapshot && !selectedSnapshot.is_current && (
          <Button
            {...secondaryButtonProps}
            loading={setCurrentSnapshotMutation.isPending}
            onClick={() =>
              setCurrentSnapshotMutation.mutate({
                eventId,
                data: { snapshot_id: selectedSnapshot.id },
              })
            }
          >
            Make current
          </Button>
        )}
      </Group>
    ) : (
      <Group>
        <Button
          {...secondaryButtonProps}
          onClick={() => liveQuery.refetch()}
          loading={liveQuery.isFetching}
        >
          Refresh
        </Button>
        <Button
          {...secondaryButtonProps}
          onClick={createSnapshot}
          loading={createSnapshotMutation.isPending}
        >
          Create snapshot from live
        </Button>
      </Group>
    );

  const ranking =
    mode === "Live" ? liveQuery.data : snapshotQuery.data?.ranking;
  const isLoading =
    mode === "Live"
      ? liveQuery.isLoading
      : snapshotsLoading || snapshotQuery.isLoading;

  let content;
  if (isLoading) {
    content = Array.from({ length: 11 }, (_, i) => (
      <Skeleton key={i} height={60} radius="md" />
    ));
  } else if (mode === "Snapshot" && snapshots?.length === 0) {
    content = (
      <Text c="dimmed" ta="center" py="xl">
        No ranking snapshot yet. Create one from the live ranking.
      </Text>
    );
  } else {
    content = ranking?.teams.map((entry) => (
      <TeamRankingEntry
        key={entry.team_id}
        entry={entry}
        maxTotalPoints={ranking.max_total_points}
        team={teamsById.get(entry.team_id)}
        onTeamUpdated={refetchTeams}
      />
    ));
  }

  return (
    <Stack pt={"md"}>
      <Group justify="space-between" w={"100%"}>
        <SegmentedControl
          {...segmentedControlProps}
          size="xs"
          value={mode}
          onChange={(value) => setMode(value as Mode)}
          data={["Snapshot", "Live"]}
        />
        {controls}
      </Group>
      {content}
    </Stack>
  );
};

export default RankingPanel;
