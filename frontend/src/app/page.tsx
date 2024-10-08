"use client";

import { useGetEvents } from "@/api/gen";
import EventCard from "@/components/event/EventCard";
import { skeletonProps } from "@/styles/common";

import {
  Box,
  Center,
  Container,
  Image,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";

const Home = () => {
  const { data: events } = useGetEvents();

  return (
    <Container my="xl" bg="">
      <Stack>
        <Center my="xl">
          <Image src="/assets/viscon-logo.svg" alt="VIScon Logo" maw={200} />
        </Center>
        <Box>
          <Title order={3}>Welcome to the</Title>
          <Title order={1}>VIScon Hackathon Portal</Title>
        </Box>
        {events ? (
          <>
            {events.length ? (
              <>
                <Text c="dimmed">Please select an event to get started</Text>
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </>
            ) : (
              <Text c="dimmed">
                No events found.
                <br />
                Please contact an organizer for assistance.
              </Text>
            )}
          </>
        ) : (
          <>
            <Skeleton {...skeletonProps} h={20} w="62%" />
            <Skeleton {...skeletonProps} h={58} />
            <Skeleton {...skeletonProps} h={58} />
          </>
        )}
      </Stack>
    </Container>
  );
};

export default Home;
