"use client";

import PublicVoteInput from "@/components/rating/PublicVoteInput";
import RatingInput from "@/components/rating/RatingInput";
import { useResolveParams } from "@/hooks/useResolveParams";

import { Stack } from "@mantine/core";

const Page = () => {
  const { policies } = useResolveParams();

  return (
    <Stack>
      {policies?.can_manage_public_vote && <PublicVoteInput />}
      {policies?.can_manage_jury_rating && <RatingInput />}
    </Stack>
  );
};

export default Page;
