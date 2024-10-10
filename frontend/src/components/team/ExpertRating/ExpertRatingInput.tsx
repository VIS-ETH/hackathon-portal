import ExpertRating, { ExpertRatingGenericProps } from ".";

import {
  useCreateExpertRating,
  useGetExpertRatings,
  useGetMe,
  useUpdateExpertRating,
} from "@/api/gen";

const ExpertRatingInput = ({
  teamId,
  category,
  description,
}: ExpertRatingGenericProps) => {
  const { data: me } = useGetMe();

  const { data: ratings = [], refetch: refetchRatings } = useGetExpertRatings({
    team_id: teamId,
  });

  const createRatingMutation = useCreateExpertRating();
  const updateRatingMutation = useUpdateExpertRating();

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
    <ExpertRating
      category={category}
      description={description}
      rating={rating?.rating ?? 0}
      setRating={handleUpdate}
    />
  );
};

export default ExpertRatingInput;
