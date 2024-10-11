"use client";

import { useGetEvents, useGetEventsRoles } from "@/api/gen";
import EventCard from "@/components/event/EventCard";
import { cardProps, skeletonProps } from "@/styles/common";

import {
  Box,
  Card,
  Center,
  Container,
  Group,
  Image,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";

const Home = () => {
  const { data: events } = useGetEvents();
  const { data: eventRoles } = useGetEventsRoles();

  const visibleEventIds = events?.map((event) => event.id);
  const affiliatedEventIds = Object.keys(eventRoles || {});
  const hiddenEventIds = affiliatedEventIds.filter(
    (eventId) => !visibleEventIds?.includes(eventId),
  );

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
              <>
                {hiddenEventIds.length ? (
                  <Card {...cardProps} style={{ borderStyle: "dashed" }}>
                    <Group justify="space-between">
                      <Text c="dimmed">
                        You are part of {hiddenEventIds.length} hidden event
                        {hiddenEventIds.length > 1 ? "s" : ""}.
                      </Text>
                    </Group>
                  </Card>
                ) : (
                  <Text c="dimmed">
                    No events found.
                    <br />
                    Please contact an organizer for assistance.
                  </Text>
                )}
              </>
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
