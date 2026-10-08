"use client";

import PageSkeleton from "@/components/PageSkeleton";
import EventAffiliatesTable from "@/components/admin/EventAffiliatesTable";
import EventContentTab from "@/components/admin/EventContentTab";
import EventSettings from "@/components/admin/EventSettings";
import RankingTab from "@/components/admin/RankingTab";
import TeamsTable from "@/components/admin/TeamsTable";
import DiscordControls from "@/components/admin/discord/DiscordControls";
import SecretsTab from "@/components/admin/secrets/SecretsTab";
import { useResolveParams } from "@/hooks/useResolveParams";
import { confirmDiscard } from "@/hooks/useUnsavedChanges";
import { iconProps, pageTabsProps, tabsPanelProps } from "@/styles/common";

import { useEffect, useState } from "react";

import { Tabs } from "@mantine/core";

import {
  IconBrandDiscord,
  IconFileText,
  IconKey,
  IconSettings,
  IconShieldHalf,
  IconTrophy,
  IconUsers,
} from "@tabler/icons-react";

const Admin = () => {
  const { event, refetchEvent } = useResolveParams();
  const [activeTab, setActiveTab] = useState<string>("general");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const validTabs = [
      "general",
      "roles",
      "teams",
      "secrets",
      "ranking",
      "content",
      "discord",
    ];
    if (validTabs.includes(hash)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- window.location.hash is a browser-only API unavailable during SSR render
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (value: string | null) => {
    if (value && value !== activeTab && confirmDiscard()) {
      setActiveTab(value);
      window.history.replaceState(null, "", `#${value}`);
    }
  };

  if (!event) {
    return <PageSkeleton />;
  }

  return (
    <Tabs
      {...pageTabsProps}
      value={activeTab}
      onChange={handleTabChange}
      keepMounted={false}
    >
      <Tabs.List>
        <Tabs.Tab value="general" leftSection={<IconSettings {...iconProps} />}>
          General
        </Tabs.Tab>
        <Tabs.Tab value="roles" leftSection={<IconShieldHalf {...iconProps} />}>
          Roles
        </Tabs.Tab>
        <Tabs.Tab value="teams" leftSection={<IconUsers {...iconProps} />}>
          Teams
        </Tabs.Tab>
        <Tabs.Tab value="secrets" leftSection={<IconKey {...iconProps} />}>
          Secrets
        </Tabs.Tab>
        <Tabs.Tab value="ranking" leftSection={<IconTrophy {...iconProps} />}>
          Ranking
        </Tabs.Tab>
        <Tabs.Tab value="content" leftSection={<IconFileText {...iconProps} />}>
          Content
        </Tabs.Tab>
        <Tabs.Tab
          value="discord"
          leftSection={<IconBrandDiscord {...iconProps} />}
        >
          Discord
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel {...tabsPanelProps} value="general">
        <EventSettings event={event} refetch={refetchEvent} />
      </Tabs.Panel>

      <Tabs.Panel {...tabsPanelProps} value="roles">
        <EventAffiliatesTable event={event} />
      </Tabs.Panel>

      <Tabs.Panel {...tabsPanelProps} value="teams">
        <TeamsTable event={event} />
      </Tabs.Panel>

      <Tabs.Panel {...tabsPanelProps} value="secrets">
        <SecretsTab event={event} />
      </Tabs.Panel>

      <Tabs.Panel {...tabsPanelProps} value="ranking">
        <RankingTab eventId={event.id} />
      </Tabs.Panel>

      <Tabs.Panel {...tabsPanelProps} value="content">
        <EventContentTab event={event} refetch={refetchEvent} />
      </Tabs.Panel>

      <Tabs.Panel {...tabsPanelProps} value="discord">
        <DiscordControls event={event} refetch={refetchEvent} />
      </Tabs.Panel>
    </Tabs>
  );
};

export default Admin;
