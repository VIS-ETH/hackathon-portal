import JuryRating from "../../rating/JuryRating";
import FeedbackCard from "./FeedbackCard";

import { TeamRanking } from "@/api/gen/schemas";

type JuryFeedbackProps = {
  entry: TeamRanking;
};

const JuryFeedback = ({ entry }: JuryFeedbackProps) => {
  return (
    <FeedbackCard
      title="Jury Ranking"
      category={entry.jury}
      rows={[
        {
          key: "presentation",
          content: (
            <JuryRating
              category="Presentation"
              rating={entry.jury.presentation_score}
              feedbackOnly
            />
          ),
        },
        {
          key: "product",
          content: (
            <JuryRating
              category="Product"
              rating={entry.jury.product_score}
              feedbackOnly
            />
          ),
        },
      ]}
    />
  );
};

export default JuryFeedback;
