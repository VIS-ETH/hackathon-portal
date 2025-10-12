import PageLoader from "../PageLoader";

import { useGetTeam } from "@/api/gen";
import { cardProps, cardSectionProps } from "@/styles/common";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";

import { Card, Center, Container, Image, Stack, Title } from "@mantine/core";

import { useDebouncedValue, useHotkeys } from "@mantine/hooks";

type TeamRankSlideProps = TeamIdWithRank & {
  isActive?: boolean;
};

const TeamRankSlide = ({ teamId, rank, isActive }: TeamRankSlideProps) => {
  const { data: team } = useGetTeam(teamId);
  const [showTeam, setShowTeam] = useState(false);
  const [debouncedIsActive] = useDebouncedValue(isActive, 50); // ensure slide isn't flashed before fully transitioning

  const onShowTeam = () => {
    setShowTeam(true);
  };

  useEffect(() => {
    // Reset showTeam when slide becomes inactive
    setShowTeam(false);
  }, [isActive]);

  useEffect(() => {
    if (!team?.photo_url) {
      return;
    }

    // Preload team photo to avoid flickering when showing the team
    const img = new window.Image();
    img.src = team.photo_url;
  }, [team]);

  useHotkeys([["Enter", onShowTeam]]);

  if (!team) {
    return <PageLoader />;
  }

  const photoCard = team.photo_url && (
    <Card {...cardProps} w={600}>
      <Card.Section {...cardSectionProps} p={0} mah="50vh">
        <Image src={team.photo_url} alt="Team Photo" fit="cover" />
      </Card.Section>
    </Card>
  );

  const hypeTextsRanked = [
    "The moment you've all been waiting for... your Hackathon Champions are...",
    "Our amazing runners-up, securing the silver prize...",
    "Taking home the bronze medal... give it up for...",
    "Just off the podium with an incredible performance...",
  ];

  const hypeTextsGeneric = [
    "Are you ready?",
    "Next up...",
    "Here we go!",
    "Make some noise for...",
    "Congratulations to...",
  ];

  const hypeText =
    rank <= 4
      ? hypeTextsRanked[rank - 1]
      : hypeTextsGeneric[(rank - 1) % hypeTextsGeneric.length];

  const confetti = (
    <>
      {/* Confetti logic. We need to control visibility via opacity to allow the component to
      generate confetti particles in the background and let them fall. Otherwise, the effect would be less dramatic. */}
      <Confetti
        opacity={showTeam ? 0 : 1}
        numberOfPieces={10}
        style={{ zIndex: -100 }}
      />
      <Confetti
        opacity={showTeam ? 1 : 0}
        numberOfPieces={showTeam ? 0 : 150}
        style={{ zIndex: -100 }}
      />
      <Confetti
        opacity={showTeam ? 1 : 0}
        numberOfPieces={25}
        style={{ zIndex: -100 }}
      />
    </>
  );

  return (
    <>
      <Container ta="center" h="100%">
        <Center h="100%">
          <Stack gap={50} align="center">
            <Stack>
              <Title order={3}>Rank {rank}</Title>
              {debouncedIsActive && showTeam ? (
                <Title>{team.name}</Title>
              ) : (
                <Title c="dimmed" onClick={onShowTeam}>
                  {hypeText}
                </Title>
              )}
            </Stack>
            {debouncedIsActive && showTeam && photoCard}
          </Stack>
        </Center>
      </Container>
      {confetti}
    </>
  );
};

export default TeamRankSlide;

export type TeamIdWithRank = {
  teamId: string;
  rank: number;
};
