import TechnicalQuestions from "../technicalQuestions/TechnicalQuestionList";

import TeamRanking from "@/components/admin/TeamRanking";
import { cardProps } from "@/styles/common";

import { useState } from "react";

import { Card, SegmentedControl } from "@mantine/core";

type RankingProps = {
  eventId: string;
};

const Ranking = ({ eventId }: RankingProps) => {
  const views = ["Ranking", "Technical Questions"];
  const [currentView, setCurrentView] = useState("Ranking");

  return (
    <Card {...cardProps}>
      <SegmentedControl
        value={currentView}
        onChange={setCurrentView}
        data={views}
      />

      {currentView === "Ranking" && <TeamRanking eventId={eventId} />}
      {currentView === "Technical Questions" && (
        <TechnicalQuestions eventId={eventId} />
      )}
    </Card>
  );
};

export default Ranking;
