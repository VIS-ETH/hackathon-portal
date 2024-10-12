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
        <Box flex={1}>
          <HistoryChart eventId={event.id} grow />
        </Box>
        <Box flex={1} style={{ overflow: "scroll" }}>
          <OverviewLeaderboardTable eventId={event.id} />
        </Box>
      </Stack>
    </Overlay>
  );
};

export default SidequestsDashboard;
