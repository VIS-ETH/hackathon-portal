import FeedbackCard from "./FeedbackCard";

import { TeamRanking } from "@/api/gen/schemas";

type SidequestFeedbackProps = {
  entry: TeamRanking;
};

// Only the team's own result: the sidequest leaderboard is live data, and could
// contradict the ranking snapshot this feedback comes from.
const SidequestFeedback = ({ entry }: SidequestFeedbackProps) => {
  return (
    <FeedbackCard
      title="Sidequest Ranking"
      category={entry.sidequest}
      rows={[]}
    />
  );
};

export default SidequestFeedback;
