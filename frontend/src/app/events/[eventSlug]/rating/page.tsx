"use client";

import PageSkeleton from "@/components/PageSkeleton";
import ScrollableSegmentedControl from "@/components/ScrollableSegmentedControl";
import PublicVoteInput from "@/components/rating/PublicVoteInput";
import RatingInput from "@/components/rating/RatingInput";
import { useHashTab } from "@/hooks/useHashTab";
import { useResolveParams } from "@/hooks/useResolveParams";

import { Group, Stack, Text, Title } from "@mantine/core";

const VIEWS = [
  { label: "Public Vote", value: "vote" },
  { label: "Jury Rating", value: "jury" },
];
const VIEW_VALUES = VIEWS.map((view) => view.value);

const Page = () => {
  const { event, policies } = useResolveParams();

  // only used when the user may do both
  // defaults to whatever is open, e.g. for admins
  const [activeView, handleViewChange] = useHashTab(
    VIEW_VALUES,
    event?.jury_rating_open ? "jury" : "vote",
  );

  if (!event || !policies) {
    return <PageSkeleton />;
  }

  const canVote = policies.can_manage_public_vote;
  const canRate = policies.can_manage_jury_rating;

  if (canVote && canRate) {
    return (
      <Stack>
        <Group justify="space-between">
          <Title order={2}>Rating</Title>
          <ScrollableSegmentedControl
            data={VIEWS}
            value={activeView}
            onChange={handleViewChange}
          />
        </Group>
        {activeView === "vote" ? <PublicVoteInput /> : <RatingInput />}
      </Stack>
    );
  }

  return (
    <Stack>
      <Title order={2}>
        {canVote ? "Public Vote" : canRate ? "Jury Rating" : "Rating"}
      </Title>
      {canVote && <PublicVoteInput />}
      {canRate && <RatingInput />}
      {!canVote && !canRate && (
        <Text c="dimmed">There is nothing for you to rate.</Text>
      )}
    </Stack>
  );
};

export default Page;
