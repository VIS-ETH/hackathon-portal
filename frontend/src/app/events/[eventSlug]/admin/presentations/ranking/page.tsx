"use client";

import { useGetRanking } from "@/api/gen";
import { TeamRanking } from "@/api/gen/schemas";
import PageLoader from "@/components/PageLoader";
import Presentation from "@/components/admin/Presentation";
import TeamRankSlide from "@/components/team/TeamRankSlide";
import { useResolveParams } from "@/hooks/useResolveParams";

import { Center, Text } from "@mantine/core";

import { useSearchParams } from "next/navigation";

const RankingPresentation = () => {
  const searchParams = useSearchParams();
  const { event } = useResolveParams();

  // the current snapshot
  const { data: snapshot } = useGetRanking(event?.id ?? "", undefined, {
    query: {
      enabled: !!event,
    },
  });

  if (!event || snapshot === undefined) {
    return <PageLoader />;
  }

  if (snapshot === null) {
    return (
      <Center h="100vh">
        <Text c="dimmed">No current ranking snapshot</Text>
      </Center>
    );
  }

  const maxTeams = parseInt(searchParams.get("maxTeams") ?? "10");
  const entries = snapshot.ranking.teams.slice(0, maxTeams).reverse();

  const toKey = (entry: TeamRanking) => entry.team_id;
  const toTitle = (entry: TeamRanking) => `Rank ${entry.rank}`;
  const toContent = (entry: TeamRanking, isActive: boolean | undefined) => (
    <TeamRankSlide entry={entry} isActive={isActive} />
  );

  return (
    <Presentation
      elements={entries}
      toKey={toKey}
      toTitle={toTitle}
      toContent={toContent}
      background
    />
  );
};

export default RankingPresentation;
