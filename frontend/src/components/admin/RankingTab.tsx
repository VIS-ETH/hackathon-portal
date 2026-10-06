import TechnicalQuestions from "../technicalQuestions/TechnicalQuestionList";

import RankingPanel from "@/components/admin/RankingPanel";
import { confirmDiscard } from "@/hooks/useUnsavedChanges";
import { cardProps, segmentedControlProps } from "@/styles/common";

import { useState } from "react";

import { Card, SegmentedControl } from "@mantine/core";

type RankingTabProps = {
  eventId: string;
};

const RankingTab = ({ eventId }: RankingTabProps) => {
  const views = ["Ranking", "Technical Questions"];
  const [currentView, setCurrentView] = useState("Ranking");

  return (
    <Card {...cardProps}>
      <SegmentedControl
        {...segmentedControlProps}
        value={currentView}
        onChange={(view) => confirmDiscard() && setCurrentView(view)}
        data={views}
      />

      {currentView === "Ranking" && <RankingPanel eventId={eventId} />}
      {currentView === "Technical Questions" && (
        <TechnicalQuestions eventId={eventId} />
      )}
    </Card>
  );
};

export default RankingTab;
