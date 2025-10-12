"use client";

import { useGetTeams } from "@/api/gen";
import { Team } from "@/api/gen/schemas/team";
import RatingCard from "@/components/rating/RatingCard";
import TeamSelectCard from "@/components/rating/TeamSelectCard";
import { useResolveParams } from "@/hooks/useResolveParams";

import { useState } from "react";

import { Box, Button, Drawer, Stack } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

const RatingInput = () => {
  const { event } = useResolveParams();

  const [teamSelectOpened, { open: teamSelectOpen, close: teamSelectClose }] =
    useDisclosure(false);

  const { data: teams } = useGetTeams({ event_id: event?.id ?? "" });

  const [currentTeam, setCurrentTeam] = useState<Team | undefined>(undefined);

  return (
    <>
      <Drawer
        opened={teamSelectOpened}
        onClose={teamSelectClose}
        title="Select a Team"
        position="right"
      >
        <Stack>
          {teams?.map((team) => (
            <Box
              key={team.id}
              onClick={() => {
                setCurrentTeam(team);
                teamSelectClose();
              }}
              style={{ cursor: "pointer" }}
            >
              <TeamSelectCard key={team.id} team={team} />
            </Box>
          ))}
        </Stack>
      </Drawer>

      <Button variant="default" onClick={teamSelectOpen}>
        Select Team
      </Button>
      {currentTeam && <RatingCard team={currentTeam} />}
    </>
  );
};

export default RatingInput;
