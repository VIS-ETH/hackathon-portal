"use client";

import PageSkeleton from "@/components/PageSkeleton";
import HistoryChart from "@/components/sidequest/HistoryChart";
import OverviewLeaderboardTable from "@/components/sidequest/OverviewLeaderboardTable";
import { useResolveParams } from "@/hooks/useResolveParams";

import { Box, Overlay, Stack } from "@mantine/core";

const SidequestsDashboard = () => {
  const { event } = useResolveParams();

  if (!event) {
    return <PageSkeleton />;
  }

  return (
    <Overlay backgroundOpacity={1} color="#fff">
      <Stack p="lg" gap="lg" h="100%" justify="stretch">
        <Box style={{ flex: 1, flexGrow: 1 }}>
          <HistoryChart eventId={event.id} grow />
        </Box>
        <Box style={{ flex: 1, flexGrow: 0 }}>
          <OverviewLeaderboardTable eventId={event.id} limit={3} />
        </Box>
      </Stack>
    </Overlay>
  );
};

export default SidequestsDashboard;
