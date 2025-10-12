import ExpertRating, { ExpertRatingGenericProps } from ".";

import { useGetTeamExpertRatings } from "@/api/gen";

const ExpertRatingFeedback = ({
  teamId,
  category,
  description,
}: ExpertRatingGenericProps) => {
  const { data: ratings } = useGetTeamExpertRatings(teamId);

  const rating = ratings?.[category];

  return (
    <ExpertRating
      category={category}
      description={description}
      feedbackOnly
      rating={rating ?? 0}
    />
  );
};

export default ExpertRatingFeedback;
