import { useGetTeams } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import JuryRatingCard from "@/components/rating/JuryRatingCard";
import TeamSelect from "@/components/select/TeamSelect";
import { useResolveParams } from "@/hooks/useResolveParams";
import { iconProps } from "@/styles/common";

import { ActionIcon, Group, Stack, Text, Tooltip } from "@mantine/core";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";

const RatingInput = () => {
  const { event } = useResolveParams();

  // the API lists the teams by index, as the select does
  const { data: teams } = useGetTeams(
    { event_id: event?.id ?? "" },
    { query: { enabled: !!event } },
  );

  // the selected team lives in the URL, so a reload or a link keeps it
  const searchParams = useSearchParams();
  const teamSlug = searchParams.get("team");
  const currentTeam = teams?.find((t) => t.slug === teamSlug);
  const setCurrentTeam = (team: Team | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (team) {
      params.set("team", team.slug);
    } else {
      params.delete("team");
    }
    const query = params.size > 0 ? `?${params}` : "";
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query}${window.location.hash}`,
    );
  };

  const position = teams?.findIndex((t) => t.id === currentTeam?.id) ?? -1;
  const step = (offset: number) => setCurrentTeam(teams?.[position + offset]);

  return (
    <Stack>
      <Group gap="xs" wrap="nowrap">
        {event && (
          <TeamSelect
            eventId={event.id}
            teamId={currentTeam?.id}
            setTeam={setCurrentTeam}
            aria-label="Team"
            size="sm"
            flex={1}
          />
        )}
        <Tooltip label="Previous team">
          <ActionIcon
            variant="default"
            size="input-sm"
            radius="md"
            aria-label="Previous team"
            disabled={position <= 0}
            onClick={() => step(-1)}
          >
            <IconChevronLeft {...iconProps} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Next team">
          <ActionIcon
            variant="default"
            size="input-sm"
            radius="md"
            aria-label="Next team"
            disabled={!teams || position >= teams.length - 1}
            onClick={() => step(1)}
          >
            <IconChevronRight {...iconProps} />
          </ActionIcon>
        </Tooltip>
      </Group>
      {currentTeam ? (
        <JuryRatingCard key={currentTeam.id} team={currentTeam} />
      ) : (
        <Text c="dimmed">Select a team to rate it.</Text>
      )}
    </Stack>
  );
};

export default RatingInput;
