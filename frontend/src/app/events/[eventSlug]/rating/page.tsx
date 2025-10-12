"use client";

import PublicVoteInput from "@/components/rating/PublicVoteInput";
import RatingInput from "@/components/rating/RatingInput";
import { useResolveParams } from "@/hooks/useResolveParams";

import { Stack } from "@mantine/core";

const Page = () => {
  const { policies } = useResolveParams();

  if (policies?.can_manage_expert_rating) {
  }
  return (
    <Stack>
      {policies?.can_public_vote && <PublicVoteInput />}
      {policies?.can_manage_expert_rating && <RatingInput />}
    </Stack>
  );
};

export default Page;
