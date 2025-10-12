"use client";

import TeamImage from "../team/TeamImage";

import { useGetMyVotes, useGetTeams, useSetMyVote } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { useResolveParams } from "@/hooks/useResolveParams";
import { cardProps } from "@/styles/common";

import { useEffect, useState } from "react";

import {
  Button,
  Card,
  Center,
  Divider,
  Flex,
  Group,
  Image,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";

type RankingCardProps = {
  team?: Team;
  place: number;
};
const places = [
  {
    rank: "1st",
    title: "First Place",
    color: "#D4AF37", // Gold
    accent: "rgba(212,175,55,0.12)",
    emoji: "🏆",
    height: 300,
  },
  {
    rank: "2nd",
    title: "Second Place",
    color: "#C0C0C0", // Silver
    accent: "rgba(192,192,192,0.12)",
    emoji: "🥈",
    height: 280,
  },
  {
    rank: "3rd",
    title: "Third Place",
    color: "#CD7F32", // Bronze
    accent: "rgba(205,127,50,0.12)",
    emoji: "🥉",
    height: 260,
  },
];

const RankingCard = ({ team, place }: RankingCardProps) => {
  const p = places[place - 1];
  return (
    <Card
      shadow="sm"
      radius="md"
      withBorder
      w={200}
      h={p.height}
      className={`flex-1 border-4 rounded-2xl transition-transform hover:scale-[1.02]`}
      style={{
        borderColor: p.color,
        background: `linear-gradient(180deg, rgba(255,255,255,0.98), ${p.accent})`,
      }}
    >
      <Card.Section>
        <Image
          src={team?.photo_url || `/assets/awards/Trophy_${place}.svg`}
          height={160}
          alt={team?.name}
          fit="contain"
        />
      </Card.Section>
      <Stack justify="end" h={"100%"}>
        <Group justify="center" mt="md" align="flex-end">
          <Text>{team?.name}</Text>
          <Title order={4} style={{ color: p.color }}>
            {p.emoji} {p.title}
          </Title>
        </Group>
      </Stack>
    </Card>
  );
};

type SelectCardProps = {
  team: Team;
  choose: (place: number, teamId: string) => void;
};

const SelectCard = ({ team, choose }: SelectCardProps) => {
  return (
    <Card {...cardProps} w={250}>
      <Card.Section>
        <TeamImage
          url={team.photo_url}
          height={160}
          alt={team.name}
          fit="contain"
        />
      </Card.Section>
      <Center>
        <Title order={5} mt="md">
          {team.name}
        </Title>
      </Center>
      <Divider />
      <Group pt="xs">
        <Button
          onClick={() => choose(1, team.id)}
          styles={{
            root: {
              background: `linear-gradient(180deg, rgba(255,255,255,0.98), ${places[0].accent})`,
              borderColor: places[0].color,
            },
          }}
        >
          {places[0].emoji}
        </Button>
        <Button
          onClick={() => choose(2, team.id)}
          styles={{
            root: {
              background: `linear-gradient(180deg, rgba(255,255,255,0.98), ${places[1].accent})`,
              borderColor: places[1].color,
            },
          }}
        >
          {places[1].emoji}
        </Button>
        <Button
          onClick={() => choose(3, team.id)}
          styles={{
            root: {
              background: `linear-gradient(180deg, rgba(255,255,255,0.98), ${places[2].accent})`,
              borderColor: places[2].color,
            },
          }}
        >
          {places[2].emoji}
        </Button>
      </Group>
    </Card>
  );
};

const PublicVoteInput = () => {
  const { event, team: my_team } = useResolveParams();

  const { data: my_votes } = useGetMyVotes({ event_id: event?.id ?? "" });
  const { data: teams = [] } = useGetTeams({ event_id: event?.id ?? "" });

  const finalists = teams.filter((t) => t.finalist);
  const mutateVote = useSetMyVote();
  const [firstPlace, setFirstPlace] = useState<string | null>(
    my_votes?.find((v) => v.rank === 1)?.team_id ?? null,
  );
  const [secondPlace, setSecondPlace] = useState<string | null>(
    my_votes?.find((v) => v.rank === 2)?.team_id ?? null,
  );
  const [thirdPlace, setThirdPlace] = useState<string | null>(
    my_votes?.find((v) => v.rank === 3)?.team_id ?? null,
  );

  useEffect(() => {
    setFirstPlace(my_votes?.find((v) => v.rank === 1)?.team_id ?? null);
    setSecondPlace(my_votes?.find((v) => v.rank === 2)?.team_id ?? null);
    setThirdPlace(my_votes?.find((v) => v.rank === 3)?.team_id ?? null);
  }, [my_votes]);

  const choose = (place: number, teamId: string) => {
    if (!event) return;
    if ([firstPlace, secondPlace, thirdPlace].includes(teamId)) {
      alert("You have already assigned this team a place.");
      return;
    }
    if (place === 1) {
      setFirstPlace(teamId);
    } else if (place === 2) {
      setSecondPlace(teamId);
    } else if (place === 3) {
      setThirdPlace(teamId);
    }
    mutateVote.mutate({
      data: {
        place: place,
        team_id: teamId,
      },
      params: {
        event_id: event.id,
      },
    });
  };

  if (!event || !my_votes || !teams) {
    return <Skeleton height={200} radius="md" />;
  }

  return (
    <Stack>
      <Center>
        <Title order={3} mb="md">
          Your Selected Top 3 Teams
        </Title>
      </Center>
      <Flex gap="md" justify="center" align="end" wrap="wrap">
        <RankingCard
          team={teams.find((t) => t.id === secondPlace) ?? undefined}
          place={2}
        />
        <RankingCard
          team={teams.find((t) => t.id === firstPlace) ?? undefined}
          place={1}
        />
        <RankingCard
          team={teams.find((t) => t.id === thirdPlace) ?? undefined}
          place={3}
        />
      </Flex>
      <Divider />
      <Center>
        <Title order={4}>Finalists</Title>
      </Center>
      <Flex gap="md" justify="center" align="center" wrap="wrap">
        { finalists
            .filter(
              (team) =>
                ![firstPlace, secondPlace, thirdPlace].includes(team.id) && !(team.id === my_team?.id)
            )
            .map((team) => (
              <SelectCard key={team.id} team={team} choose={choose} />
            ))}
      </Flex>
    </Stack>
  );
};

export default PublicVoteInput;
