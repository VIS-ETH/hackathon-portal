"use client";

import PageSkeleton from "@/components/PageSkeleton";
import PublicVoteInput from "@/components/rating/PublicVoteInput";
import RatingInput from "@/components/rating/RatingInput";
import { useResolveParams } from "@/hooks/useResolveParams";
import { confirmDiscard } from "@/hooks/useUnsavedChanges";
import { segmentedControlProps } from "@/styles/common";

import { useEffect, useState } from "react";

import { Group, SegmentedControl, Stack, Text, Title } from "@mantine/core";

const VIEWS = [
  { label: "Public Vote", value: "vote" },
  { label: "Jury Rating", value: "jury" },
];

const Page = () => {
  const { event, policies } = useResolveParams();

  // only used when the user may do both
  const [view, setView] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (VIEWS.some((v) => v.value === hash)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- window.location.hash is a browser-only API unavailable during SSR render
      setView(hash);
    }
  }, []);

  if (!event || !policies) {
    return <PageSkeleton />;
  }

  const canVote = policies.can_manage_public_vote;
  const canRate = policies.can_manage_jury_rating;

  if (canVote && canRate) {
    // defaults to whatever is open, e.g. for admins
    const activeView = view ?? (event.jury_rating_open ? "jury" : "vote");
    const handleViewChange = (value: string) => {
      if (confirmDiscard()) {
        setView(value);
        window.history.replaceState(null, "", `#${value}`);
      }
    };

    return (
      <Stack>
        <Group justify="space-between">
          <Title order={2}>Rating</Title>
          <SegmentedControl
            {...segmentedControlProps}
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
