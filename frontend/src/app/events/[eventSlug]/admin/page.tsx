"use client";

import PageSkeleton from "@/components/PageSkeleton";
import DiscordControls from "@/components/admin/DiscordControls";
import DocumentationContentControls from "@/components/admin/DocumentationContentControls";
import EventAffiliatesTable from "@/components/admin/EventAffiliatesTable";
import EventSettings from "@/components/admin/EventSettings";
import InvitationControls from "@/components/admin/InvitationControls";
import TeamPasswordsControls from "@/components/admin/TeamPasswordsControls";
import TeamRanking from "@/components/admin/TeamRanking";
import TeamsTable from "@/components/admin/TeamsTable";
import WelcomeContentControls from "@/components/admin/WelcomeContentControls";
import { useResolveParams } from "@/hooks/useResolveParams";
import { iconProps } from "@/styles/common";

import { useEffect, useState } from "react";

import { Stack, Tabs } from "@mantine/core";

import {
  IconAlignJustified,
  IconBrandDiscord,
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
      "ranking",
      "welcome",
      "documentation",
      "discord",
    ];
    if (validTabs.includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (value: string | null) => {
    if (value) {
      setActiveTab(value);
      window.history.replaceState(null, "", `#${value}`);
    }
  };

  if (!event) {
    return <PageSkeleton />;
  }

  return (
    <Tabs value={activeTab} onChange={handleTabChange} mt="-md">
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
        <Tabs.Tab value="ranking" leftSection={<IconTrophy {...iconProps} />}>
          Ranking
        </Tabs.Tab>
        <Tabs.Tab
          value="welcome"
          leftSection={<IconAlignJustified {...iconProps} />}
        >
          Welcome Content
        </Tabs.Tab>
        <Tabs.Tab
          value="documentation"
          leftSection={<IconAlignJustified {...iconProps} />}
        >
          Documentation Content
        </Tabs.Tab>
        <Tabs.Tab
          value="discord"
          leftSection={<IconBrandDiscord {...iconProps} />}
        >
          Discord
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="general" mt="md">
        <EventSettings event={event} refetch={refetchEvent} />
      </Tabs.Panel>

      <Tabs.Panel value="roles" mt="md">
        <Stack>
          <EventAffiliatesTable event={event} />
          <InvitationControls event={event} />
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="teams" mt="md">
        <Stack>
          {activeTab === "teams" && <TeamsTable event={event} />}
          <TeamPasswordsControls event={event} />
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="ranking" mt="md">
        <TeamRanking eventId={event.id} />
      </Tabs.Panel>

      <Tabs.Panel value="welcome" mt="md">
        <WelcomeContentControls event={event} refetch={refetchEvent} />
      </Tabs.Panel>

      <Tabs.Panel value="documentation" mt="md">
        <DocumentationContentControls event={event} refetch={refetchEvent} />
      </Tabs.Panel>

      <Tabs.Panel value="discord" mt="md">
        <DiscordControls event={event} refetch={refetchEvent} />
      </Tabs.Panel>
    </Tabs>
  );
};

export default Admin;
