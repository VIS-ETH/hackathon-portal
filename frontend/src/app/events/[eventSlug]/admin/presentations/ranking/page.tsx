"use client";

import { useGetLeaderboard } from "@/api/gen";
import PageLoader from "@/components/PageLoader";
import Presentation from "@/components/admin/Presentation";
import TeamRankSlide, { TeamIdWithRank } from "@/components/team/TeamRankSlide";
import { useResolveParams } from "@/hooks/useResolveParams";

import { useSearchParams } from "next/navigation";

const Ranking = () => {
  const searchParams = useSearchParams();
  const { event } = useResolveParams();

  const { data: rawEntries } = useGetLeaderboard(event?.id ?? "", {
    query: {
      enabled: !!event,
    },
  });

  if (!event || !rawEntries) {
    return <PageLoader />;
  }

  const maxTeams = parseInt(searchParams.get("maxTeams") ?? "10");
  const entries = rawEntries
    .slice(0, maxTeams)
    .map(
      (teamId, index) =>
        ({
          teamId,
          rank: index + 1,
        }) satisfies TeamIdWithRank,
    )
    .reverse();

  const toKey = (element: TeamIdWithRank) => element.teamId;
  const toTitle = (element: TeamIdWithRank) => `Rank ${element.rank}`;
  const toContent = (
    element: TeamIdWithRank,
    isActive: boolean | undefined,
  ) => <TeamRankSlide {...element} isActive={isActive} />;

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

export default Ranking;
