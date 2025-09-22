"use client";

import { useGetTeams } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import PageLoader from "@/components/PageLoader";
import Presentation from "@/components/admin/Presentation";
import TeamAssignmentSlide from "@/components/team/TeamAssignmentSlide";
import { useResolveParams } from "@/hooks/useResolveParams";

const Assignments = () => {
  const { event } = useResolveParams();

  const { data: teams } = useGetTeams(
    {
      event_id: event?.id ?? "",
    },
    {
      query: {
        enabled: !!event,
      },
    },
  );

  if (!event || !teams) {
    return <PageLoader />;
  }

  const toKey = (element: Team) => element.id;
  const toTitle = (element: Team) => element.name;
  const toContent = (element: Team) => <TeamAssignmentSlide team={element} />;

  return (
    <Presentation
      elements={teams}
      toKey={toKey}
      toTitle={toTitle}
      toContent={toContent}
      background
    />
  );
};

export default Assignments;
