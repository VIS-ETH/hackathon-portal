"use client";

import { EventRole } from "@/api/gen/schemas";
import PageSkeleton from "@/components/PageSkeleton";
import AttemptsTableForParticipant from "@/components/sidequest/AttemptsTableForParticipant";
import AttemptsTableForSidequestMaster from "@/components/sidequest/AttemptsTableForSidequestMaster";
import HistoryChart from "@/components/sidequest/HistoryChart";
import OverviewLeaderboardTable from "@/components/sidequest/OverviewLeaderboardTable";
import SidequestsList from "@/components/sidequest/SidequestsList";
import { useHashTab } from "@/hooks/useHashTab";
import { useResolveParams } from "@/hooks/useResolveParams";
import {
  cardProps,
  iconProps,
  pageTabsProps,
  tabsPanelProps,
} from "@/styles/common";

import { Card, Stack, Tabs } from "@mantine/core";

import { IconStopwatch, IconTicTac, IconTrophy } from "@tabler/icons-react";

const TABS = ["leaderboard", "sidequests", "attempts"];

const Sidequests = () => {
  const { event, roles, policies } = useResolveParams();
  const [activeTab, handleTabChange] = useHashTab(TABS, "leaderboard");

  if (!event || !roles || !policies) {
    return <PageSkeleton />;
  }

  const isParticipant = roles.includes(EventRole.Participant);
  const canViewAttemptsTab =
    isParticipant || policies.can_manage_sidequest_attempt;

  return (
    <Tabs {...pageTabsProps} value={activeTab} onChange={handleTabChange}>
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

      <Tabs.Panel {...tabsPanelProps} value="leaderboard">
        <Stack>
          <HistoryChart eventId={event.id} />
          <Card {...cardProps}>
            <Card.Section>
              <OverviewLeaderboardTable eventId={event.id} />
            </Card.Section>
          </Card>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel {...tabsPanelProps} value="sidequests">
        <SidequestsList event={event} manage={policies.can_manage_sidequest} />
      </Tabs.Panel>

      <Tabs.Panel {...tabsPanelProps} value="attempts">
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
