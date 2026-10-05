import JuryRating, { JuryRatingGenericProps } from ".";

import {
  useCreateJuryRating,
  useGetJuryRatings,
  useGetMe,
  useUpdateJuryRating,
} from "@/api/gen";

const JuryRatingInput = ({
  teamId,
  category,
  description,
}: JuryRatingGenericProps) => {
  const { data: me } = useGetMe();

  const { data: ratings = [], refetch: refetchRatings } = useGetJuryRatings({
    team_id: teamId,
  });

  const createRatingMutation = useCreateJuryRating();
  const updateRatingMutation = useUpdateJuryRating();

  const rating = ratings.find(
    (r) => r.category === category && r.user_id == me?.id,
  );

  const handleUpdate = async (value: number) => {
    if (rating) {
      await updateRatingMutation.mutateAsync({
        ratingId: rating.id,
        data: {
          rating: value,
        },
      });
    } else {
      await createRatingMutation.mutateAsync({
        data: {
          category,
          rating: value,
          team_id: teamId,
        },
      });
    }

    refetchRatings();
  };

  return (
    <JuryRating
      category={category}
      description={description}
      rating={rating?.rating ?? 0}
      setRating={handleUpdate}
    />
  );
};

export default JuryRatingInput;
