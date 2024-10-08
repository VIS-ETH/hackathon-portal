"use client";

import { EventRole } from "@/api/gen/schemas";
import PageSkeleton from "@/components/PageSkeleton";
import AttemptsTableForParticipant from "@/components/sidequest/AttemptsTableForParticipant";
import AttemptsTableForSidequestMaster from "@/components/sidequest/AttemptsTableForSidequestMaster";
import HistoryChart from "@/components/sidequest/HistoryChart";
import OverviewLeaderboardTable from "@/components/sidequest/OverviewLeaderboardTable";
import SidequestsList from "@/components/sidequest/SidequestsList";
import { useResolveParams } from "@/hooks/useResolveParams";
import { iconProps } from "@/styles/common";

import { Stack, Tabs } from "@mantine/core";

import { IconStopwatch, IconTicTac, IconTrophy } from "@tabler/icons-react";

const Sidequests = () => {
  const { event, roles, policies } = useResolveParams();

  if (!event || !roles || !policies) {
    return <PageSkeleton />;
  }

  const isParticipant = roles.includes(EventRole.Participant);
  const canViewAttemptsTab =
    isParticipant || policies.can_manage_sidequest_attempt;

  return (
    <Tabs defaultValue="leaderboard" mt="-md">
      <Tabs.List>
        <Tabs.Tab
          value="leaderboard"
          leftSection={<IconTrophy {...iconProps} />}
        >
          Leaderboard
        </Tabs.Tab>
        <Tabs.Tab
          value="sidequests"
          leftSection={<IconTicTac {...iconProps} />}
        >
          Sidequests
        </Tabs.Tab>
        {canViewAttemptsTab && (
          <Tabs.Tab
            value="attempts"
            leftSection={<IconStopwatch {...iconProps} />}
          >
            Attempts
          </Tabs.Tab>
        )}
      </Tabs.List>

      <Tabs.Panel value="leaderboard" mt="md">
        <Stack>
          <HistoryChart eventId={event.id} />
          <OverviewLeaderboardTable eventId={event.id} />
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="sidequests" mt="md">
        <SidequestsList event={event} manage={policies.can_manage_sidequest} />
      </Tabs.Panel>

      <Tabs.Panel value="attempts" mt="md">
        <Stack>
          {policies.can_manage_sidequest_attempt && (
            <AttemptsTableForSidequestMaster eventId={event.id} />
          )}
          {isParticipant && <AttemptsTableForParticipant eventId={event.id} />}
        </Stack>
      </Tabs.Panel>
    </Tabs>
  );
};

export default Sidequests;
