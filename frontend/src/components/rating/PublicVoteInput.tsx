"use client";

import TeamImage from "../team/TeamImage";

import {
  useGetMe,
  useGetMyVotes,
  useGetTeams,
  useGetTeamsRoles,
  useSetMyVote,
} from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { useResolveParams } from "@/hooks/useResolveParams";
import {
  cardProps,
  cardSectionProps,
  podiumPlaces,
  skeletonProps,
} from "@/styles/common";
import { seededShuffle } from "@/utils";

import { useMemo, useState } from "react";

import {
  Button,
  Card,
  Flex,
  Group,
  Image,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";

type RankingCardProps = {
  team?: Team;
  place: number;
};
// in podiumPlaces order
const placeStyles = [
  { accent: "rgba(212,175,55,0.12)", emoji: "🏆", height: 300 },
  { accent: "rgba(192,192,192,0.12)", emoji: "🥈", height: 280 },
  { accent: "rgba(205,127,50,0.12)", emoji: "🥉", height: 260 },
];
const places = podiumPlaces.map((p, i) => ({ ...p, ...placeStyles[i] }));

const RankingCard = ({ team, place }: RankingCardProps) => {
  const p = places[place - 1];
  return (
    <Card
      {...cardProps}
      w={200}
      h={p.height}
      style={{
        borderColor: p.color,
        background: `linear-gradient(180deg, rgba(255,255,255,0.98), ${p.accent})`,
      }}
    >
      {team?.photo_url ? (
        <Card.Section>
          <TeamImage url={team.photo_url} alt={team.name} />
        </Card.Section>
      ) : (
        <Card.Section pt="md">
          <Image
            src={`/assets/awards/Trophy_${place}.svg`}
            h={160}
            alt={p.title}
            fit="contain"
          />
        </Card.Section>
      )}
      <Stack gap={0} mt="auto">
        <Text fw={700} size="lg" ta="center" c={p.color}>
          {p.title}
        </Text>
        {team && (
          <Text ta="center" truncate>
            {team.name}
          </Text>
        )}
      </Stack>
    </Card>
  );
};

type PodiumListProps = {
  // in place order
  podium: (Team | undefined)[];
};

const PodiumList = ({ podium }: PodiumListProps) => {
  return (
    <Card {...cardProps} hiddenFrom="sm">
      {places.map((p, i) => (
        <Card.Section key={p.place} {...cardSectionProps}>
          <Group wrap="nowrap">
            {podium[i]?.photo_url ? (
              <TeamImage
                url={podium[i].photo_url}
                width={80}
                alt={podium[i].name}
              />
            ) : (
              <Image
                src={`/assets/awards/Trophy_${p.place}.svg`}
                w={80}
                h={60}
                alt={p.title}
                fit="contain"
              />
            )}
            <Stack gap={0} miw={0}>
              <Text fw={700} c={p.color}>
                {p.title}
              </Text>
              {podium[i] ? (
                <Text truncate>{podium[i].name}</Text>
              ) : (
                <Text c="dimmed">Not chosen yet</Text>
              )}
            </Stack>
          </Group>
        </Card.Section>
      ))}
    </Card>
  );
};

type SelectCardProps = {
  team: Team;
  choose: (place: number, teamId: string) => void;
};

const SelectCard = ({ team, choose }: SelectCardProps) => {
  return (
    <Card {...cardProps}>
      {team.photo_url && (
        <Card.Section>
          <TeamImage url={team.photo_url} alt={team.name} />
        </Card.Section>
      )}
      <Card.Section {...cardSectionProps} display="flex" flex={1}>
        <Text fw={600} ta="center" m="auto">
          {team.name}
        </Text>
      </Card.Section>
      <Card.Section {...cardSectionProps}>
        <Group grow gap="xs">
          {places.map((p) => (
            <Tooltip key={p.place} label={p.title}>
              <Button
                aria-label={`Vote for ${p.title}`}
                onClick={() => choose(p.place, team.id)}
                styles={{
                  root: {
                    background: `linear-gradient(180deg, rgba(255,255,255,0.98), ${p.accent})`,
                    borderColor: p.color,
                  },
                }}
              >
                {p.emoji}
              </Button>
            </Tooltip>
          ))}
        </Group>
      </Card.Section>
    </Card>
  );
};

const PublicVoteInput = () => {
  const { data: me } = useGetMe();
  const { event } = useResolveParams();

  const { data: myVotes } = useGetMyVotes(
    { event_id: event?.id ?? "" },
    { query: { enabled: !!event } },
  );
  const { data: teams } = useGetTeams(
    { event_id: event?.id ?? "" },
    { query: { enabled: !!event } },
  );
  const { data: teamsRoles } = useGetTeamsRoles(
    { event_id: event?.id ?? "" },
    { query: { enabled: !!event } },
  );
  const finalistsShuffled = useMemo(() => {
    if (!teams || !teamsRoles || !me) return [];
    const affiliateToTeams = Object.keys(teamsRoles);
    const finalists = teams.filter(
      (t) => t.finalist && !affiliateToTeams.includes(t.id),
    );
    return seededShuffle(finalists, me.id);
  }, [teams, teamsRoles, me]);
  const affiliatedFinalists = useMemo(() => {
    if (!teams || !teamsRoles) return [];
    return teams.filter((t) => t.finalist && teamsRoles[t.id]);
  }, [teams, teamsRoles]);
  const mutateVote = useSetMyVote();
  const [firstPlace, setFirstPlace] = useState<string | null>(
    myVotes?.find((v) => v.place === 1)?.team_id ?? null,
  );
  const [secondPlace, setSecondPlace] = useState<string | null>(
    myVotes?.find((v) => v.place === 2)?.team_id ?? null,
  );
  const [thirdPlace, setThirdPlace] = useState<string | null>(
    myVotes?.find((v) => v.place === 3)?.team_id ?? null,
  );
  const [prevMyVotes, setPrevMyVotes] = useState(myVotes);

  if (myVotes !== prevMyVotes) {
    setPrevMyVotes(myVotes);
    setFirstPlace(myVotes?.find((v) => v.place === 1)?.team_id ?? null);
    setSecondPlace(myVotes?.find((v) => v.place === 2)?.team_id ?? null);
    setThirdPlace(myVotes?.find((v) => v.place === 3)?.team_id ?? null);
  }

  const choose = (place: number, teamId: string) => {
    if (!event) return;
    const placed = [firstPlace, secondPlace, thirdPlace];
    if (placed.includes(teamId)) {
      alert("You have already assigned this team a place.");
      return;
    }
    const setPlace = [setFirstPlace, setSecondPlace, setThirdPlace][place - 1];
    setPlace(teamId);
    mutateVote.mutate(
      {
        data: {
          place: place,
          team_id: teamId,
        },
        params: {
          event_id: event.id,
        },
      },
      { onError: () => setPlace(placed[place - 1]) },
    );
  };

  if (!event || !myVotes || !teams || !teamsRoles || !me) {
    return <Skeleton {...skeletonProps} height={200} />;
  }

  const podium = [firstPlace, secondPlace, thirdPlace].map((id) =>
    teams.find((t) => t.id === id),
  );

  return (
    <Stack gap="xl">
      <Stack>
        <Title order={3}>Your Top 3</Title>
        <Flex gap="md" justify="center" align="end" visibleFrom="sm">
          <RankingCard team={podium[1]} place={2} />
          <RankingCard team={podium[0]} place={1} />
          <RankingCard team={podium[2]} place={3} />
        </Flex>
        <PodiumList podium={podium} />
      </Stack>
      <Stack>
        <Title order={3}>Finalists</Title>
        {finalistsShuffled.length === 0 && affiliatedFinalists.length === 0 && (
          <Text c="dimmed">There are no finalists yet.</Text>
        )}
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }}>
          {finalistsShuffled
            .filter(
              (team) =>
                ![firstPlace, secondPlace, thirdPlace].includes(team.id),
            )
            .map((team) => (
              <SelectCard key={team.id} team={team} choose={choose} />
            ))}
        </SimpleGrid>
        {affiliatedFinalists.length > 0 && (
          <Text c="dimmed" size="sm">
            You cannot vote for teams you are affiliated with:{" "}
            {affiliatedFinalists.map((t) => t.name).join(", ")}
          </Text>
        )}
      </Stack>
    </Stack>
  );
};

export default PublicVoteInput;
