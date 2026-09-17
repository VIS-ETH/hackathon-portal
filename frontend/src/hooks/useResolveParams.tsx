import {
  useGetEventBySlug,
  useGetEventRoles,
  useGetMyPolicies,
  useGetProjectBySlug,
  useGetSidequestBySlug,
  useGetTeamBySlug,
} from "@/api/gen";

import { useParams } from "next/navigation";

type Params = {
  eventSlug?: string;
  teamSlug?: string;
  projectSlug?: string;
  sidequestSlug?: string;
};

export const useResolveParams = () => {
  const { eventSlug, teamSlug, projectSlug, sidequestSlug } =
    useParams<Params>();

  const { data: event, refetch: refetchEvent } = useGetEventBySlug(
    eventSlug ?? "",
    { query: { enabled: !!eventSlug } },
  );

  const { data: roles, refetch: refetchRoles } = useGetEventRoles(
    event?.id ?? "",
    { query: { enabled: !!event?.id } },
  );

  const { data: team, refetch: refetchTeam } = useGetTeamBySlug(
    eventSlug ?? "",
    teamSlug ?? "",
    { query: { enabled: !!eventSlug && !!teamSlug } },
  );

  const { data: project, refetch: refetchProject } = useGetProjectBySlug(
    eventSlug ?? "",
    projectSlug ?? "",
    { query: { enabled: !!eventSlug && !!projectSlug } },
  );

  const { data: sidequest, refetch: refetchSidequest } = useGetSidequestBySlug(
    eventSlug ?? "",
    sidequestSlug ?? "",
    { query: { enabled: !!eventSlug && !!sidequestSlug } },
  );

  const { data: policies, refetch: refetchPolicies } = useGetMyPolicies(
    {
      event_id: team ? undefined : event?.id,
      team_id: team?.id,
    },
    {
      query: {
        enabled: !!event || !!team,
      },
    },
  );

  return {
    event,
    refetchEvent,
    roles,
    refetchRoles,
    team,
    refetchTeam,
    project,
    refetchProject,
    sidequest,
    refetchSidequest,
    policies,
    refetchPolicies,
  };
};
